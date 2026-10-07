import { NextResponse } from "next/server";

import {
  MAX_BODY_BYTES,
  BUDGET_OPTIONS,
  TIMELINE_OPTIONS,
  optionLabel,
  serviceLabel,
} from "@/lib/inquiry/config";
import { buildMessage, resolveEmailProvider } from "@/lib/inquiry/email";
import { parseInquiry, type FieldErrors } from "@/lib/inquiry/schema";
import {
  deriveRateLimitKey,
  getRateLimiter,
  readClientIdentifier,
  shouldFailOpen,
} from "@/lib/inquiry/rate-limit";

/** Force dynamic execution — this route must never be statically cached. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FailureCode =
  | "VALIDATION_ERROR"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "SUBMISSION_FAILED";

function fail(status: number, code: FailureCode, fieldErrors?: FieldErrors) {
  return NextResponse.json(
    fieldErrors ? { ok: false, code, fieldErrors } : { ok: false, code },
    { status },
  );
}

/**
 * Reads the request body while enforcing the byte cap on the stream itself.
 *
 * `Content-Length` is checked first as a cheap fast-reject, but it is not
 * relied upon: it can be absent, and a client can under-report it. The reader
 * below counts decoded bytes as they arrive and cancels the stream the moment
 * the limit is passed, so an oversized upload is never fully buffered.
 *
 * @returns the decoded text, or the reason it was refused.
 */
async function readBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; reason: "TOO_LARGE" | "UNREADABLE" }> {
  const declared = request.headers.get("content-length");

  if (declared) {
    const declaredBytes = Number(declared);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      return { ok: false, reason: "TOO_LARGE" };
    }
  }

  const body = request.body;

  // No stream available (some runtimes/tests): fall back to buffered read and
  // check the resulting size.
  if (!body) {
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > maxBytes) {
        return { ok: false, reason: "TOO_LARGE" };
      }
      return { ok: true, text };
    } catch {
      return { ok: false, reason: "UNREADABLE" };
    }
  }

  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let received = 0;
  let text = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) break;

      if (value) {
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel().catch(() => undefined);
          return { ok: false, reason: "TOO_LARGE" };
        }
        text += decoder.decode(value, { stream: true });
      }
    }

    text += decoder.decode();
  } catch {
    return { ok: false, reason: "UNREADABLE" };
  }

  return { ok: true, text };
}

export async function POST(request: Request) {
  /* 1. Media type — JSON only. ------------------------------------------- */
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return fail(415, "UNSUPPORTED_MEDIA_TYPE");
  }

  /* 2. Rate limit --------------------------------------------------------- *
   * The identifier is hashed before use; no raw address is stored or logged.  *
   * Runs before parsing so malformed floods are bounded too.                  */
  const limiter = getRateLimiter();
  const identifier = deriveRateLimitKey(readClientIdentifier(request.headers));
  const limit = await limiter.check(identifier);

  if (limit.status === "limited") {
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED" satisfies FailureCode },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (limit.status === "unavailable") {
    // The limiter could not enforce its policy. Default behaviour is to fail
    // closed: an outage must not silently become unlimited access.
    if (shouldFailOpen()) {
      console.warn("[inquiry] RATE_LIMIT_UNAVAILABLE — allowing request (fail-open opted in)");
    } else {
      console.error(
        `[inquiry] rate limiter unavailable (${limiter.name}) — refusing submission`,
      );
      return NextResponse.json(
        { ok: false, code: "SERVICE_UNAVAILABLE" satisfies FailureCode },
        {
          status: 503,
          headers: { "Retry-After": "60" },
        },
      );
    }
  }

  /* 3. Body size + JSON parsing ------------------------------------------ */
  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);

  if (!body.ok) {
    return body.reason === "TOO_LARGE"
      ? fail(413, "PAYLOAD_TOO_LARGE")
      : fail(400, "INVALID_PAYLOAD");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(body.text);
  } catch {
    return fail(400, "INVALID_PAYLOAD");
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fail(400, "INVALID_PAYLOAD");
  }

  /* 4. Honeypot ----------------------------------------------------------- *
   * Returns the same success shape as a real submission and sends nothing, so *
   * a bot learns nothing. Logged as a category only.                          */
  const honeypotProbe = (parsed as Record<string, unknown>).website;
  const honeypotFilled =
    typeof honeypotProbe === "string" && honeypotProbe.trim().length > 0;

  if (honeypotFilled) {
    console.info("[inquiry] honeypot triggered — submission discarded");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  /* 5. Validation --------------------------------------------------------- */
  const result = parseInquiry(parsed);

  if (!result.success) {
    return fail(400, "VALIDATION_ERROR", result.fieldErrors);
  }

  const inquiry = result.data;

  /* 6. Provider resolution — never silently falls back in production ------ */
  const resolution = resolveEmailProvider();

  if (!resolution.ok) {
    console.error(`[inquiry] email configuration error: ${resolution.reason}`);
    return fail(500, "SUBMISSION_FAILED");
  }

  /* 7. Delivery ----------------------------------------------------------- */
  const message = buildMessage(
    { to: resolution.to, from: resolution.from },
    {
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company,
      serviceLabel: serviceLabel(inquiry.service),
      budgetLabel: optionLabel(BUDGET_OPTIONS, inquiry.budget),
      timelineLabel: optionLabel(TIMELINE_OPTIONS, inquiry.timeline),
      problem: inquiry.problem,
      details: inquiry.details,
      timestamp: new Date().toISOString(),
    },
  );

  const delivery = await resolution.provider.sendInquiry(message);

  if (!delivery.ok) {
    console.error(`[inquiry] delivery failed (${delivery.category})`);
    return fail(500, "SUBMISSION_FAILED");
  }

  // Success is only reported when the configured provider accepted the message.
  console.info(`[inquiry] delivered via ${delivery.provider}`);
  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Anything other than POST is refused with 405 and an Allow header. */
export async function GET() {
  return NextResponse.json({ ok: false, code: "INVALID_PAYLOAD" }, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
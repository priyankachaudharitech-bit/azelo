import { headerSafe, renderInquiryEmail, type InquiryEmailData } from "./html";

/**
 * Email delivery abstraction.
 *
 * The API route depends only on `EmailProvider` and `sendInquiry()`. Swapping
 * Resend for any other transport means adding one class here — no route or UI
 * changes.
 *
 * CONFIGURATION RULE: the console provider is a development convenience and is
 * REFUSED when `NODE_ENV === "production"`. Production requires an explicit
 * provider choice; misconfiguration fails the inquiry safely rather than
 * silently pretending to deliver mail.
 */

export type InquiryMessage = {
  /** Configured, verified sender. Never the visitor's address. */
  from: string;
  /** Destination address (owner inbox). */
  to: string;
  /** Reply-To: the validated address supplied by the visitor. */
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

/** Coarse failure categories. Deliberately excludes provider payloads. */
export type EmailErrorCategory =
  | "CONFIGURATION"
  | "AUTHENTICATION"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_REJECTED"
  | "NETWORK"
  | "UNKNOWN";

export type EmailResult =
  | { ok: true; provider: string }
  | { ok: false; provider: string; category: EmailErrorCategory };

export interface EmailProvider {
  readonly name: string;
  sendInquiry(message: InquiryMessage): Promise<EmailResult>;
}

export type ProviderResolution =
  | { ok: true; provider: EmailProvider; to: string; from: string }
  | { ok: false; provider: string; reason: string };

/* -------------------------------------------------------------------------- */
/* Console provider — development only                                         */
/* -------------------------------------------------------------------------- */

/**
 * Writes the rendered inquiry to stdout instead of sending mail.
 *
 * Refuses to run in production. In development this prints the full email body
 * because inspecting the rendered output is the entire purpose of the adapter;
 * production logs never contain inquiry content.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  async sendInquiry(message: InquiryMessage): Promise<EmailResult> {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        provider: this.name,
        category: "CONFIGURATION",
      };
    }

    console.info(
      `[inquiry:console] to=${message.to} replyTo=${message.replyTo} subject=${JSON.stringify(message.subject)}`,
    );
    console.info(`[inquiry:console] body:\n${message.text}`);

    return { ok: true, provider: this.name };
  }
}

/* -------------------------------------------------------------------------- */
/* Resend provider — production transport, native fetch, no SDK               */
/* -------------------------------------------------------------------------- */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RESEND_TIMEOUT_MS = 8000;

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";

  readonly #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  async sendInquiry(message: InquiryMessage): Promise<EmailResult> {
    let response: Response;

    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.#apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: message.from,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
        signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      // Never log the message body or the key — only the failure shape.
      console.error(
        `[inquiry:resend] transport failure (${error instanceof Error ? error.name : "unknown"})`,
      );
      return { ok: false, provider: this.name, category: "NETWORK" };
    }

    if (response.ok) {
      return { ok: true, provider: this.name };
    }

    // The provider's response body may contain account detail; log only status.
    if (response.status === 401 || response.status === 403) {
      console.error("[inquiry:resend] rejected: API key is invalid or lacks permission");
      return { ok: false, provider: this.name, category: "AUTHENTICATION" };
    }

    if (response.status === 429) {
      console.error("[inquiry:resend] rejected: provider rate limit reached");
      return { ok: false, provider: this.name, category: "PROVIDER_RATE_LIMIT" };
    }

    console.error(`[inquiry:resend] rejected with status ${response.status}`);
    return { ok: false, provider: this.name, category: "PROVIDER_REJECTED" };
  }
}

/* -------------------------------------------------------------------------- */
/* Resolution                                                                 */
/* -------------------------------------------------------------------------- */

function readSetting(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Builds the provider for the current environment.
 *
 * Development default is the console provider. Production requires
 * `EMAIL_PROVIDER=resend` plus a key and both addresses — a missing value
 * produces an actionable configuration error instead of a silent fallback.
 */
export function resolveEmailProvider(): ProviderResolution {
  const to = readSetting("INQUIRY_TO_EMAIL");
  const from = readSetting("INQUIRY_FROM_EMAIL");
  const configured = readSetting("EMAIL_PROVIDER");

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && configured !== "resend") {
    return {
      ok: false,
      provider: "none",
      reason: "EMAIL_PROVIDER must be set to \"resend\" in production.",
    };
  }

  const providerName = configured ?? "console";

  if (providerName === "console") {
    return {
      ok: true,
      provider: new ConsoleEmailProvider(),
      to: to ?? "owner-not-configured@localhost",
      from: from ?? "console@localhost",
    };
  }

  if (providerName !== "resend") {
    return {
      ok: false,
      provider: providerName,
      reason: `Unknown EMAIL_PROVIDER "${providerName}". Use "resend" or "console".`,
    };
  }

  const apiKey = readSetting("RESEND_API_KEY");

  if (!apiKey) {
    return { ok: false, provider: "resend", reason: "RESEND_API_KEY is not set." };
  }

  if (!to) {
    return {
      ok: false,
      provider: "resend",
      reason: "INQUIRY_TO_EMAIL is not set — the owner inbox is unknown.",
    };
  }

  if (!from) {
    return {
      ok: false,
      provider: "resend",
      reason: "INQUIRY_FROM_EMAIL is not set — a verified sender is required.",
    };
  }

  return { ok: true, provider: new ResendEmailProvider(apiKey), to, from };
}

/** Builds the full message from validated inquiry data. */
export function buildMessage(
  settings: { to: string; from: string },
  data: InquiryEmailData,
): InquiryMessage {
  const rendered = renderInquiryEmail(data);

  // The sender is resolved at configuration time; defence in depth, strip any
  // control characters before it reaches an API payload.
  const from = headerSafe(settings.from);

  return {
    from,
    to: settings.to,
    replyTo: data.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
}
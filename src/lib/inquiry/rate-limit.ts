import { createHash } from "node:crypto";

import { RATE_LIMIT_DEFAULTS } from "./config";

/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 *
 * Two implementations sit behind one interface:
 *
 *   RateLimiter
 *   ├── InMemoryRateLimiter    development + automated tests only
 *   └── UpstashRateLimiter     production (persistent, multi-instance safe)
 *
 * THE IN-MEMORY LIMITER IS NOT A PRODUCTION RATE LIMITER. It keeps counters in
 * the Node.js process heap, so serverless cold starts reset it, concurrent
 * instances each enforce an independent limit, and a restart clears every
 * counter. `createRateLimiter()` therefore refuses to select it in production
 * unless the operator explicitly opts out via RATE_LIMIT_FAIL_OPEN.
 *
 * ALGORITHM — fixed window, atomic
 * --------------------------------
 * A single Redis EVAL executes this Lua script server-side:
 *
 *   local count = redis.call('INCR', KEYS[1])
 *   if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
 *   local ttl  = redis.call('PTTL', KEYS[1])
 *   return { count, ttl }
 *
 * Redis executes Lua scripts atomically (single-threaded, no interleaving), so
 * INCR + conditional PEXPIRE + PTTL cannot interleave with a competing request.
 * That avoids the classic read-then-write race of a naive GET -> increment -> SET
 * flow, and it needs exactly ONE network round trip per check — no multi-command
 * pipeline that could be observed mid-sequence.
 *
 * Expiry is set only on the first increment of a window, so a burst of requests
 * cannot extend the window indefinitely.
 *
 * PRIVACY
 * -------
 * Raw client addresses are never stored. The identifier is SHA-256 hashed and
 * truncated server-side, namespaced under `inquiry:rl:`, and expires with the
 * window. The hash is never returned to the client or included in any response.
 * ============================================================================
 */

export type RateLimitResult =
  | { status: "allowed"; retryAfterSeconds: number }
  | { status: "limited"; retryAfterSeconds: number }
  /**
   * The limiter could not reach its backend. Deliberately distinct from
   * "allowed" so the route can apply its failure policy instead of silently
   * treating an outage as unlimited access.
   */
  | { status: "unavailable"; retryAfterSeconds: number };

export interface RateLimiter {
  /** Identifier used in logs. Never used to build a user-visible message. */
  readonly name: string;
  check(key: string): Promise<RateLimitResult>;
}

/* -------------------------------------------------------------------------- */
/* Policy                                                                     */
/* -------------------------------------------------------------------------- */

export type RateLimitPolicy = { max: number; windowMs: number };

function readNumber(name: string): number | null {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

export function readPolicy(): RateLimitPolicy {
  return {
    max: readNumber("RATE_LIMIT_MAX") ?? RATE_LIMIT_DEFAULTS.max,
    windowMs:
      (readNumber("RATE_LIMIT_WINDOW_SECONDS") ?? RATE_LIMIT_DEFAULTS.windowSeconds) *
      1000,
  };
}

/**
 * Failure policy.
 *
 * DEFAULT (false): FAIL CLOSED. If the limiter cannot do its job — backend
 * unreachable, malformed response, or simply not configured in production — the
 * inquiry is refused with a generic 503 rather than accepted. An unavailable
 * limiter must never silently become an unlimited one.
 *
 * OPT-IN (true): fail open, logging `RATE_LIMIT_UNAVAILABLE` on every bypass.
 * Choose this only when losing a genuine inquiry is worse than the additional
 * spam exposure, and only together with a CAPTCHA or upstream filter.
 */
export function shouldFailOpen(): boolean {
  return process.env.RATE_LIMIT_FAIL_OPEN?.toLowerCase() === "true";
}

/* -------------------------------------------------------------------------- */
/* In-memory — development and tests only                                      */
/* -------------------------------------------------------------------------- */

export class InMemoryRateLimiter implements RateLimiter {
  readonly name = "in-memory";

  readonly #max: number;
  readonly #windowMs: number;
  readonly #entries = new Map<string, { count: number; resetAt: number }>();

  constructor(policy: RateLimitPolicy, now: () => number = Date.now) {
    this.#max = policy.max;
    this.#windowMs = policy.windowMs;
    this.#now = now;
  }

  readonly #now: () => number;

  check(key: string): Promise<RateLimitResult> {
    const now = this.#now();
    this.#sweep(now);

    const existing = this.#entries.get(key);

    if (!existing || existing.resetAt <= now) {
      this.#entries.set(key, { count: 1, resetAt: now + this.#windowMs });
      return Promise.resolve({ status: "allowed", retryAfterSeconds: 0 });
    }

    if (existing.count >= this.#max) {
      return Promise.resolve({
        status: "limited",
        retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      });
    }

    existing.count += 1;
    return Promise.resolve({ status: "allowed", retryAfterSeconds: 0 });
  }

  #sweep(now: number): void {
    for (const [key, entry] of this.#entries) {
      if (entry.resetAt <= now) this.#entries.delete(key);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Upstash Redis REST — production                                             */
/* -------------------------------------------------------------------------- */

/**
 * Atomic fixed-window increment, expiry and TTL read in one server-side script.
 * `count == 1` means this is the first hit of the window, so this is the only
 * moment an expiry needs to be set.
 */
const FIXED_WINDOW_LUA = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
  "local ttl = redis.call('PTTL', KEYS[1])",
  "return { count, ttl }",
].join(" ");

export type UpstashSettings = {
  url: string;
  token: string;
  timeoutMs: number;
};

export class UpstashRateLimiter implements RateLimiter {
  readonly name = "upstash";

  readonly #policy: RateLimitPolicy;
  readonly #settings: UpstashSettings;
  readonly #fetch: typeof fetch;

  constructor(
    policy: RateLimitPolicy,
    settings: UpstashSettings,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.#policy = policy;
    this.#settings = settings;
    this.#fetch = fetchImpl;
  }

  async check(key: string): Promise<RateLimitResult> {
    const redisKey = `inquiry:rl:${key}`;

    let payload: unknown;

    try {
      const response = await this.#fetch(`${this.#settings.url}/eval`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.#settings.token}`,
          "Content-Type": "application/json",
        },
        // Upstash REST EVAL payload: [script, numKeys, key..., arg...]
        body: JSON.stringify([
          FIXED_WINDOW_LUA,
          1,
          redisKey,
          String(this.#policy.windowMs),
        ]),
        signal: AbortSignal.timeout(this.#settings.timeoutMs),
        cache: "no-store",
      });

      if (!response.ok) {
        return { status: "unavailable", retryAfterSeconds: 0 };
      }

      payload = (await response.json()) as unknown;
    } catch {
      // Transport error, timeout, or unreadable body. Never log the token.
      return { status: "unavailable", retryAfterSeconds: 0 };
    }

    const parsed = parseEvalResult(payload);

    if (parsed === null) {
      return { status: "unavailable", retryAfterSeconds: 0 };
    }

    const { count, ttlMs } = parsed;

    if (count <= this.#policy.max) {
      return { status: "allowed", retryAfterSeconds: 0 };
    }

    return {
      status: "limited",
      retryAfterSeconds: Math.max(1, Math.ceil(Math.max(ttlMs, 0) / 1000)),
    };
  }
}

/**
 * Upstash returns `{ result: [count, pttl] }`. Anything else — an error object, a
 * missing field, a non-numeric value — is treated as unavailable rather than
 * allowed.
 */
function parseEvalResult(payload: unknown): { count: number; ttlMs: number } | null {
  if (payload === null || typeof payload !== "object") return null;

  const result = (payload as { result?: unknown }).result;

  if (!Array.isArray(result) || result.length < 2) return null;

  const [rawCount, rawTtl] = result;
  const count = Number(rawCount);
  const ttlMs = Number(rawTtl);

  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) return null;

  return { count, ttlMs };
}

/* -------------------------------------------------------------------------- */
/* Unavailable — no usable backend                                            */
/* -------------------------------------------------------------------------- */

/**
 * Stand-in used when no persistent backend is configured in production. Always
 * reports `unavailable`, which the route turns into a 503 under the default
 * fail-closed policy.
 */
export class UnavailableRateLimiter implements RateLimiter {
  readonly name = "unavailable";

  check(): Promise<RateLimitResult> {
    return Promise.resolve({ status: "unavailable", retryAfterSeconds: 0 });
  }
}

/* -------------------------------------------------------------------------- */
/* Key derivation                                                             */
/* -------------------------------------------------------------------------- */

const KEY_NAMESPACE = "inquiry:rl:";

/**
 * Derives a non-reversible rate-limit key from a client identifier.
 *
 * SHA-256 over the namespace + identifier, truncated to 32 hex characters
 * (128 bits) — far more than enough to make collisions irrelevant, while
 * keeping stored keys short. The raw address is discarded immediately and is
 * never persisted, logged or returned.
 */
export function deriveRateLimitKey(identifier: string): string {
  return createHash("sha256")
    .update(`${KEY_NAMESPACE}${identifier}`)
    .digest("hex")
    .slice(0, 32);
}

/* -------------------------------------------------------------------------- */
/* Client identifier                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Reads the raw client identifier from proxy headers.
 *
 * TRUST MODEL — these headers are NOT intrinsically trustworthy. They are
 * client-controlled unless something in front of the application rewrites them.
 *
 *   Managed platforms (Vercel, Cloudflare Workers, Fly, Railway):
 *     The edge overwrites `x-forwarded-for` with the real client address and
 *     appends the original chain. Reading the FIRST entry is correct.
 *
 *   Self-hosted behind nginx / a reverse proxy:
 *     Out of the box nginx uses `proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for`,
 *     which APPENDS to a client-supplied header. An attacker can therefore lead
 *     with a spoofed value. You must either
 *       (a) set `proxy_set_header X-Forwarded-For $remote_addr;` so nginx
 *           overwrites rather than appends, or
 *       (b) configure this function to read the LAST entry instead.
 *
 * This is the single place deployment-specific trust decisions live. No
 * fingerprinting, no cookies, no user-agent or device signals — only the network
 * address, hashed immediately.
 */
export function readClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");

  // Managed platform: left-most entry is the edge-verified client address.
  const candidate =
    forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "";

  const cleaned = candidate.replace(/[^\w.:]/g, "").slice(0, 64);

  return cleaned.length > 0 ? cleaned : "anonymous";
}

/* -------------------------------------------------------------------------- */
/* Selection                                                                  */
/* -------------------------------------------------------------------------- */

function readUpstashSettings(): UpstashSettings | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;

  const timeout = readNumber("RATE_LIMIT_UPSTASH_TIMEOUT_MS") ?? 2000;

  return { url: url.replace(/\/+$/, ""), token, timeoutMs: timeout };
}

/**
 * Chooses the limiter for the current environment.
 *
 *   development / test : InMemoryRateLimiter (unless Upstash is configured)
 *   production         : UpstashRateLimiter  (REQUIRED)
 *                        UnavailableRateLimiter when unconfigured, which the
 *                        route refuses rather than bypassing.
 */
export function createRateLimiter(
  fetchImpl: typeof fetch = fetch,
): RateLimiter {
  const policy = readPolicy();
  const upstash = readUpstashSettings();

  if (upstash) {
    return new UpstashRateLimiter(policy, upstash, fetchImpl);
  }

  if (process.env.NODE_ENV === "production") {
    return new UnavailableRateLimiter();
  }

  return new InMemoryRateLimiter(policy);
}

/**
 * Process-wide singleton, cached on `globalThis` so development hot reloads do
 * not reset counters on every edit.
 */
declare global {
  var __inquiryRateLimiter: RateLimiter | undefined;
}

export function getRateLimiter(): RateLimiter {
  if (!globalThis.__inquiryRateLimiter) {
    globalThis.__inquiryRateLimiter = createRateLimiter();
  }
  return globalThis.__inquiryRateLimiter;
}

/** Test-only reset so a suite can start from a clean limiter. */
export function resetRateLimiterForTests(): void {
  globalThis.__inquiryRateLimiter = undefined;
}
/**
 * Rate limiter test suite — development QA only.
 *
 * The Upstash REST HTTP calls are mocked; NO real Redis credentials are needed
 * and no network traffic leaves the machine.
 *
 * Usage:
 *   node --experimental-strip-types scripts/limiter-tests.mjs
 */

import {
  InMemoryRateLimiter,
  UnavailableRateLimiter,
  UpstashRateLimiter,
  createRateLimiter,
  deriveRateLimitKey,
  readClientIdentifier,
  readPolicy,
  shouldFailOpen,
} from "../src/lib/inquiry/rate-limit.ts";

let passed = 0;
let failed = 0;

const green = (s) => `\u001b[32m${s}\u001b[0m`;
const red = (s) => `\u001b[31m${s}\u001b[0m`;
const dim = (s) => `\u001b[2m${s}\u001b[0m`;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(green(`PASS  ${name}`));
  } else {
    failed += 1;
    console.log(red(`FAIL  ${name}`));
    if (detail) console.log(dim(`        ${detail}`));
  }
}

const policy = { max: 5, windowMs: 60_000 };

const upstashSettings = {
  url: "https://mock.upstash.io",
  token: "mock-token-not-a-real-secret",
  timeoutMs: 1000,
};

/* -------------------------------------------------------------------------- */
/* Mock Redis: an atomic EVAL endpoint                                        */
/* -------------------------------------------------------------------------- */

/**
 * Simulates Upstash's `/eval` with correct atomic semantics. `mockAtomicRedis`
 * deliberately introduces a microtask delay inside the "script" so that any
 * non-atomic implementation (GET -> increment in app memory -> SET) would lose
 * updates and over-admit under concurrency.
 */
function mockAtomicRedis({ store = new Map(), failWith = null, malformed = false } = {}) {
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url, init });

    if (failWith) throw failWith;

    const body = JSON.parse(init.body);

    // Upstash EVAL payload: [script, numKeys, key, ...args]
    const [script, numKeys, key, windowArg] = body;

    if (typeof script !== "string" || numKeys !== 1) {
      return jsonResponse({ error: "unexpected payload" }, 400);
    }

    // Yield before mutating so callers genuinely overlap.
    await new Promise((resolve) => setTimeout(resolve, 1));

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + Number(windowArg) });
    } else {
      existing.count += 1;
    }

    const current = store.get(key);

    if (malformed) {
      return jsonResponse({ result: ["not-a-number", "also-not-a-number"] });
    }

    return jsonResponse({
      result: [current.count, Math.max(0, current.resetAt - now)],
    });
  };

  return { fetchImpl, calls, store };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

console.log("\n=== RATE LIMITER TESTS ===\n");

/* -------------------------------------------------------------------------- */
/* 1. Persistent limiter: success path                                       */
/* -------------------------------------------------------------------------- */

{
  const mock = mockAtomicRedis();
  const limiter = new UpstashRateLimiter(policy, upstashSettings, mock.fetchImpl);

  const result = await limiter.check("key-alpha");

  check(
    "persistent limiter allows the first request",
    result.status === "allowed" && result.retryAfterSeconds === 0,
    JSON.stringify(result),
  );
  check("persistent limiter is identified as upstash", limiter.name === "upstash");

  const call = mock.calls[0];
  check(
    "request targets the /eval endpoint",
    call.url === "https://mock.upstash.io/eval",
    call.url,
  );
  check(
    "token is sent as a bearer header and never in the body",
    call.init.headers.Authorization === "Bearer mock-token-not-a-real-secret" &&
      !call.init.body.includes("mock-token-not-a-real-secret"),
    "token handling incorrect",
  );
  check(
    "key is namespaced",
    JSON.parse(call.init.body)[2] === "inquiry:rl:key-alpha",
    JSON.parse(call.init.body)[2],
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Atomicity: single atomic command, never a pipeline                      */
/* -------------------------------------------------------------------------- */

{
  const mock = mockAtomicRedis();
  const limiter = new UpstashRateLimiter(policy, upstashSettings, mock.fetchImpl);
  await limiter.check("key-atomic");

  const body = JSON.parse(mock.calls[0].init.body);

  check(
    "uses a single atomic EVAL, not GET/SET/pipeline",
    mock.calls.length === 1 && typeof body[0] === "string" && body[1] === 1,
    `calls=${mock.calls.length}`,
  );
  check(
    "script performs INCR, conditional PEXPIRE and PTTL",
    body[0].includes("INCR") && body[0].includes("PEXPIRE") && body[0].includes("PTTL"),
    body[0],
  );
  check(
    "expiry is only set on the first increment of a window",
    body[0].includes("count == 1"),
    body[0],
  );
  check(
    "expiry is not the /pipeline endpoint",
    !mock.calls[0].url.includes("pipeline"),
    mock.calls[0].url,
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Limit exceeded                                                          */
/* -------------------------------------------------------------------------- */

{
  const mock = mockAtomicRedis();
  const limiter = new UpstashRateLimiter(policy, upstashSettings, mock.fetchImpl);

  const results = [];
  for (let i = 0; i < policy.max; i += 1) {
    results.push(await limiter.check("key-limit"));
  }

  check(
    `first ${policy.max} requests are allowed`,
    results.every((r) => r.status === "allowed"),
    JSON.stringify(results),
  );

  const blocked = await limiter.check("key-limit");

  check(
    "the request past the maximum is limited",
    blocked.status === "limited",
    JSON.stringify(blocked),
  );
  check(
    "limited result carries a positive Retry-After",
    blocked.retryAfterSeconds > 0,
    JSON.stringify(blocked),
  );
}

/* -------------------------------------------------------------------------- */
/* 4. CONCURRENCY — the required atomicity proof                             */
/* -------------------------------------------------------------------------- */

{
  const mock = mockAtomicRedis();
  const limiter = new UpstashRateLimiter(policy, upstashSettings, mock.fetchImpl);

  const attemptCount = 12;
  const results = await Promise.all(
    Array.from({ length: attemptCount }, () => limiter.check("key-concurrent")),
  );

  const allowed = results.filter((r) => r.status === "allowed").length;
  const limited = results.filter((r) => r.status === "limited").length;

  check(
    `concurrent burst of ${attemptCount} on one identifier admits exactly ${policy.max}`,
    allowed === policy.max,
    `allowed=${allowed} (expected ${policy.max})`,
  );
  check(
    `remaining ${attemptCount - policy.max} concurrent requests are limited`,
    limited === attemptCount - policy.max,
    `limited=${limited}`,
  );
  check(
    "no request errored or became unavailable",
    results.every((r) => r.status === "allowed" || r.status === "limited"),
    JSON.stringify(results.map((r) => r.status)),
  );
  check(
    "every concurrent request issued its own atomic call",
    mock.calls.length === attemptCount,
    `calls=${mock.calls.length}`,
  );
}

{
  // Same burst against the in-memory limiter, for parity confirmation.
  const limiter = new InMemoryRateLimiter(policy);
  const results = await Promise.all(
    Array.from({ length: 12 }, () => limiter.check("key-concurrent")),
  );
  const allowed = results.filter((r) => r.status === "allowed").length;

  check(
    "in-memory limiter applies the same maximum under concurrency",
    allowed === policy.max,
    `allowed=${allowed}`,
  );
}

/* -------------------------------------------------------------------------- */
/* 5. New window / expiry                                                      */
/* -------------------------------------------------------------------------- */

{
  let now = 1_000_000;
  const limiter = new InMemoryRateLimiter(policy, () => now);

  for (let i = 0; i < policy.max; i += 1) await limiter.check("key-window");
  check(
    "in-memory limiter blocks at the end of the window",
    (await limiter.check("key-window")).status === "limited",
  );

  now += policy.windowMs + 1;

  check(
    "in-memory limiter allows again once the window has passed",
    (await limiter.check("key-window")).status === "allowed",
  );
}

{
  // Persistent limiter: verify the server-side window advances via PTTL.
  const store = new Map();
  let fakeNow = 1_000_000;

  const fetchImpl = async (_url, init) => {
    const [, , key, windowArg] = JSON.parse(init.body);
    await new Promise((r) => setTimeout(r, 1));

    const existing = store.get(key);
    if (!existing || existing.resetAt <= fakeNow) {
      store.set(key, { count: 1, resetAt: fakeNow + Number(windowArg) });
    } else {
      existing.count += 1;
    }
    const current = store.get(key);
    return jsonResponse({
      result: [current.count, Math.max(0, current.resetAt - fakeNow)],
    });
  };

  const limiter = new UpstashRateLimiter(policy, upstashSettings, fetchImpl);

  for (let i = 0; i < policy.max; i += 1) await limiter.check("key-persist");
  check(
    "persistent limiter blocks at the end of the window",
    (await limiter.check("key-persist")).status === "limited",
  );

  fakeNow += policy.windowMs + 1;

  check(
    "persistent limiter allows again in the next window",
    (await limiter.check("key-persist")).status === "allowed",
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Provider unavailable                                                     */
/* -------------------------------------------------------------------------- */

{
  const limiter = new UpstashRateLimiter(
    policy,
    upstashSettings,
    mockAtomicRedis({ failWith: new Error("connection refused") }).fetchImpl,
  );
  const result = await limiter.check("key-down");

  check(
    "transport failure reports unavailable, never allowed",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

{
  const limiter = new UpstashRateLimiter(
    policy,
    upstashSettings,
    async () => new Response("nope", { status: 503 }),
  );
  const result = await limiter.check("key-503");

  check(
    "non-2xx provider response reports unavailable",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Malformed provider response                                              */
/* -------------------------------------------------------------------------- */

{
  const limiter = new UpstashRateLimiter(
    policy,
    upstashSettings,
    mockAtomicRedis({ malformed: true }).fetchImpl,
  );
  const result = await limiter.check("key-bad");

  check(
    "malformed numeric result reports unavailable, not allowed",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

{
  const limiter = new UpstashRateLimiter(
    policy,
    upstashSettings,
    async () => new Response("<html>gateway error</html>", { status: 200 }),
  );
  const result = await limiter.check("key-html");

  check(
    "non-JSON provider body reports unavailable",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

{
  const limiter = new UpstashRateLimiter(
    policy,
    upstashSettings,
    async () => jsonResponse({ error: "WRONGTYPE" }, 200),
  );
  const result = await limiter.check("key-error");

  check(
    "provider error object reports unavailable",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Unavailable limiter (no backend configured)                             */
/* -------------------------------------------------------------------------- */

{
  const limiter = new UnavailableRateLimiter();
  const result = await limiter.check("key-none");

  check(
    "UnavailableRateLimiter always reports unavailable",
    result.status === "unavailable",
    JSON.stringify(result),
  );
}

/* -------------------------------------------------------------------------- */
/* 9. Environment-driven selection                                            */
/* -------------------------------------------------------------------------- */

{
  const saved = { ...process.env };

  // Production without Redis credentials must NOT select the in-memory limiter.
  process.env.NODE_ENV = "production";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const prodLimiter = createRateLimiter();
  check(
    "production without Redis config does NOT fall back to in-memory",
    prodLimiter.name === "unavailable",
    `selected: ${prodLimiter.name}`,
  );

  // Production with Redis credentials selects the persistent limiter.
  process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
  const prodWithRedis = createRateLimiter();
  check(
    "production with Redis config selects the persistent limiter",
    prodWithRedis.name === "upstash",
    `selected: ${prodWithRedis.name}`,
  );

  // Development selects the in-memory limiter.
  process.env.NODE_ENV = "development";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const devLimiter = createRateLimiter();
  check(
    "development still uses the in-memory limiter",
    devLimiter.name === "in-memory",
    `selected: ${devLimiter.name}`,
  );

  process.env = saved;
}

/* -------------------------------------------------------------------------- */
/* 10. Failure policy flag                                                     */
/* -------------------------------------------------------------------------- */

{
  const saved = process.env.RATE_LIMIT_FAIL_OPEN;

  delete process.env.RATE_LIMIT_FAIL_OPEN;
  check("fail-open defaults to false (fail closed)", shouldFailOpen() === false);

  process.env.RATE_LIMIT_FAIL_OPEN = "true";
  check("RATE_LIMIT_FAIL_OPEN=true opts into fail-open", shouldFailOpen() === true);

  process.env.RATE_LIMIT_FAIL_OPEN = "TRUE";
  check("fail-open flag is case-insensitive", shouldFailOpen() === true);

  process.env.RATE_LIMIT_FAIL_OPEN = "yes";
  check("fail-open requires exactly 'true'", shouldFailOpen() === false);

  if (saved === undefined) delete process.env.RATE_LIMIT_FAIL_OPEN;
  else process.env.RATE_LIMIT_FAIL_OPEN = saved;
}

/* -------------------------------------------------------------------------- */
/* 11. Policy from environment                                                 */
/* -------------------------------------------------------------------------- */

{
  const saved = { max: process.env.RATE_LIMIT_MAX, win: process.env.RATE_LIMIT_WINDOW_SECONDS };

  delete process.env.RATE_LIMIT_MAX;
  delete process.env.RATE_LIMIT_WINDOW_SECONDS;
  const defaults = readPolicy();
  check("default policy is 5 per 600 seconds", defaults.max === 5 && defaults.windowMs === 600_000, JSON.stringify(defaults));

  process.env.RATE_LIMIT_MAX = "9";
  process.env.RATE_LIMIT_WINDOW_SECONDS = "60";
  const custom = readPolicy();
  check("policy honours environment overrides", custom.max === 9 && custom.windowMs === 60_000, JSON.stringify(custom));

  process.env.RATE_LIMIT_MAX = "not-a-number";
  const fallback = readPolicy();
  check("invalid override falls back to the default", fallback.max === 5, JSON.stringify(fallback));

  if (saved.max === undefined) delete process.env.RATE_LIMIT_MAX;
  else process.env.RATE_LIMIT_MAX = saved.max;
  if (saved.win === undefined) delete process.env.RATE_LIMIT_WINDOW_SECONDS;
  else process.env.RATE_LIMIT_WINDOW_SECONDS = saved.win;
}

/* -------------------------------------------------------------------------- */
/* 12. Identifier extraction and privacy                                      */
/* -------------------------------------------------------------------------- */

{
  check(
    "reads the left-most x-forwarded-for entry",
    readClientIdentifier(new Headers({ "x-forwarded-for": "203.0.113.7, 70.41.3.18, 150.172.238.178" })) === "203.0.113.7",
  );
  check(
    "falls back to x-real-ip",
    readClientIdentifier(new Headers({ "x-real-ip": "198.51.100.22" })) === "198.51.100.22",
  );
  check(
    "falls back to 'anonymous' when no header is present",
    readClientIdentifier(new Headers()) === "anonymous",
  );
  check(
    "strips injected characters from the identifier",
    // A real `Headers` object rejects CRLF outright, so this uses a stub to
    // prove the sanitiser itself would strip it if a header ever carried it.
    readClientIdentifier({
      get: (name) => (name === "x-forwarded-for" ? "203.0.113.7\r\nX-Evil: 1" : null),
    }) === "203.0.113.7XEvil:1",
  );
  check(
    "the Headers API itself rejects CRLF in a header value",
    (() => {
      try {
        new Headers({ "x-forwarded-for": "1.2.3.4\r\nX-Evil: 1" });
        return false;
      } catch {
        return true;
      }
    })(),
  );
  check(
    "truncates an over-long identifier",
    readClientIdentifier(new Headers({ "x-forwarded-for": "a".repeat(200) })).length === 64,
  );

  const keyA = deriveRateLimitKey("203.0.113.7");
  const keyB = deriveRateLimitKey("203.0.113.7");
  const keyC = deriveRateLimitKey("203.0.113.8");

  check("derived key is deterministic", keyA === keyB);
  check("different identifiers derive different keys", keyA !== keyC);
  check("derived key is 32 hex characters", /^[0-9a-f]{32}$/.test(keyA), keyA);
  check(
    "derived key does not contain the raw identifier",
    !keyA.includes("203.0.113.7"),
    keyA,
  );
  check(
    "derived key is not the raw value in any recoverable form",
    keyA !== "203.0.113.7" && !Buffer.from(keyA, "hex").toString().includes("203"),
    keyA,
  );
}

/* -------------------------------------------------------------------------- */
/* 13. No Redis credentials reachable from client code                        */
/* -------------------------------------------------------------------------- */

{
  const sources = await collectSourceFiles(new URL("../src/", import.meta.url));
  const joined = sources.map((f) => f.content).join("\n");

  const clientFiles = sources.filter(
    (f) =>
      f.path.startsWith("components") ||
      f.path.includes("app\\page") ||
      f.path.includes("app/layout"),
  );
  const clientJoined = clientFiles.map((f) => f.content).join("\n");

  check(
    "UPSTASH_REDIS_REST_URL is never referenced outside lib/inquiry",
    (joined.match(/UPSTASH_REDIS_REST_URL/g) ?? []).length === 1,
    `occurrences: ${(joined.match(/UPSTASH_REDIS_REST_URL/g) ?? []).length}`,
  );
  check(
    "UPSTASH_REDIS_REST_TOKEN is never referenced outside lib/inquiry",
    (joined.match(/UPSTASH_REDIS_REST_TOKEN/g) ?? []).length === 1,
    `occurrences: ${(joined.match(/UPSTASH_REDIS_REST_TOKEN/g) ?? []).length}`,
  );
  check(
    "no client component references any UPSTASH variable",
    !clientJoined.includes("UPSTASH"),
    "UPSTASH found in client-side code",
  );
  check(
    "no client component references the Redis token name",
    !clientJoined.includes("REDIS_TOKEN") && !clientJoined.includes("REST_TOKEN"),
    "token reference found in client-side code",
  );
  check(
    "no NEXT_PUBLIC_ variable exposes Redis credentials",
    !joined.includes("NEXT_PUBLIC_UPSTASH"),
    "client-exposed Upstash variable found",
  );
}

async function collectSourceFiles(dirUrl) {
  const { readdir, readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const rootDir = fileURLToPath(dirUrl);
  const results = [];

  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        results.push({
          path: full.slice(rootDir.length + 1),
          content: await readFile(full, "utf8"),
        });
      }
    }
  }

  await walk(rootDir);
  return results;
}

/* -------------------------------------------------------------------------- */

console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
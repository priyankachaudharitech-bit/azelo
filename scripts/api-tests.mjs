/**
 * Phase 4 inquiry API test suite.
 *
 * Development QA only — not part of the application bundle.
 *
 * Usage:
 *   next dev   (or next start)  with the server on BASE
 *   node scripts/api-tests.mjs [baseUrl]
 *
 * Override the rate limit for testing with RATE_LIMIT_MAX / RATE_LIMIT_WINDOW_SECONDS.
 */

const BASE = process.argv[2] ?? "http://localhost:3000";
const ENDPOINT = `${BASE}/api/inquiry`;

let passed = 0;
let failed = 0;
let ipCounter = 0;

const nextIp = () => {
  ipCounter += 1;
  return `10.9.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
};

const green = (s) => `\u001b[32m${s}\u001b[0m`;
const red = (s) => `\u001b[31m${s}\u001b[0m`;
const dim = (s) => `\u001b[2m${s}\u001b[0m`;

function baseBody(overrides = {}) {
  return {
    name: "Dana Whitfield",
    email: "dana@northharbor.example",
    company: "North Harbor Studio",
    service: "automation",
    budget: "3k-7-5k",
    timeline: "1-3-months",
    problem:
      "We copy every new enquiry from the website form into a spreadsheet by hand, twice a day.",
    details:
      "We run a WordPress site and a Gmail inbox. We want leads scored and routed automatically.",
    website: "",
    ...overrides,
  };
}

async function send({
  method = "POST",
  body,
  raw,
  contentType = "application/json",
  ip = nextIp(),
  headers = {},
} = {}) {
  const init = {
    method,
    headers: { "x-forwarded-for": ip, ...headers },
  };

  if (raw !== undefined) {
    init.body = raw;
    init.headers["content-type"] = contentType;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["content-type"] = "application/json";
  } else if (contentType !== null) {
    init.headers["content-type"] = contentType;
  }

  const response = await fetch(ENDPOINT, init);
  const text = await response.text();

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }

  return { status: response.status, json, text, headers: response.headers };
}

async function test(name, expectations, run) {
  const problems = [];

  try {
    const result = await run();
    const { status, json, text, headers } = result;

    if (expectations.status !== undefined && status !== expectations.status) {
      problems.push(`status ${status}, expected ${expectations.status}`);
    }

    if (expectations.code !== undefined) {
      if (!json) problems.push(`no JSON body (got: ${truncate(text)})`);
      else if (json.code !== expectations.code)
        problems.push(`code "${json.code}", expected "${expectations.code}"`);
    }

    if (expectations.ok !== undefined) {
      if (!json) problems.push(`no JSON body (got: ${truncate(text)})`);
      else if (json.ok !== expectations.ok)
        problems.push(`ok ${json.ok}, expected ${expectations.ok}`);
    }

    if (expectations.fieldErrors) {
      if (!json?.fieldErrors) {
        problems.push(`no fieldErrors (got: ${truncate(text)})`);
      } else {
        for (const [key, message] of Object.entries(expectations.fieldErrors)) {
          if (json.fieldErrors[key] === undefined) {
            problems.push(`missing fieldError "${key}"`);
          } else if (
            message !== undefined &&
            json.fieldErrors[key] !== message
          ) {
            problems.push(
              `fieldError "${key}" = "${json.fieldErrors[key]}", expected "${message}"`,
            );
          }
        }
      }
    }

    if (expectations.header) {
      for (const [key, value] of Object.entries(expectations.header)) {
        if (headers.get(key) !== value) {
          problems.push(
            `header ${key} = "${headers.get(key)}", expected "${value}"`,
          );
        }
      }
    }

    if (expectations.custom) {
      const customProblem = await expectations.custom(result);
      if (customProblem) problems.push(customProblem);
    }
  } catch (error) {
    problems.push(`threw: ${error.message}`);
  }

  if (problems.length === 0) {
    passed += 1;
    console.log(green(`PASS  ${name}`));
  } else {
    failed += 1;
    console.log(red(`FAIL  ${name}`));
    for (const problem of problems) console.log(dim(`        ${problem}`));
  }
}

const truncate = (s) => (s ? `${s.slice(0, 200)}` : "(empty)");

console.log(`\n=== PHASE 4 API TESTS against ${BASE} ===\n`);

/* 1. Valid submission ----------------------------------------------------- */
await test(
  "01 valid submission (console provider)",
  { status: 200, ok: true },
  () => send({ body: baseBody() }),
);

/* 2. Empty required fields ------------------------------------------------ */
await test(
  "02 empty required fields",
  {
    status: 400,
    code: "VALIDATION_ERROR",
    fieldErrors: {
      name: "Enter at least 2 characters.",
      email: "Enter a valid email address.",
    },
  },
  () =>
    send({
      body: baseBody({
        name: "",
        email: "",
        service: "",
        budget: "",
        timeline: "",
        problem: "",
        details: "",
      }),
    }),
);

/* 3. Invalid email -------------------------------------------------------- */
await test(
  "03 invalid email",
  { status: 400, code: "VALIDATION_ERROR", fieldErrors: { email: "Enter a valid email address." } },
  () => send({ body: baseBody({ email: "not-an-email" }) }),
);

await test(
  "03b email too long (255 chars)",
  { status: 400, code: "VALIDATION_ERROR", fieldErrors: { email: "That email address is too long." } },
  () => send({ body: baseBody({ email: `${"a".repeat(250)}@example.com` }) }),
);

/* 4. Overlong name -------------------------------------------------------- */
await test(
  "04 overlong name (101 chars)",
  {
    status: 400,
    code: "VALIDATION_ERROR",
    fieldErrors: { name: "Keep this under 100 characters." },
  },
  () => send({ body: baseBody({ name: "A".repeat(101) }) }),
);

await test(
  "04b name exactly at limit (100 chars) is accepted",
  { status: 200, ok: true },
  () => send({ body: baseBody({ name: "B".repeat(100) }) }),
);

await test(
  "04c name too short (1 char)",
  { status: 400, code: "VALIDATION_ERROR" },
  () => send({ body: baseBody({ name: "A" }) }),
);

/* 5. Overlong text fields ------------------------------------------------- */
await test(
  "05 overlong project details (3001 chars)",
  {
    status: 400,
    code: "VALIDATION_ERROR",
    fieldErrors: { details: "Keep this under 3000 characters." },
  },
  () => send({ body: baseBody({ details: "C".repeat(3001) }) }),
);

await test(
  "05b overlong current problem (1001 chars)",
  {
    status: 400,
    code: "VALIDATION_ERROR",
    fieldErrors: { problem: "Keep this under 1000 characters." },
  },
  () => send({ body: baseBody({ problem: "D".repeat(1001) }) }),
);

await test(
  "05c overlong company (151 chars)",
  { status: 400, code: "VALIDATION_ERROR" },
  () => send({ body: baseBody({ company: "E".repeat(151) }) }),
);

await test(
  "05d details exactly at limit (3000 chars) is accepted",
  { status: 200, ok: true },
  () => send({ body: baseBody({ details: "F".repeat(3000) }) }),
);

/* 6/7/8. Enum validation -------------------------------------------------- */
await test("06 invalid service enum", { status: 400, code: "VALIDATION_ERROR" }, () =>
  send({ body: baseBody({ service: "consulting" }) }),
);
await test("06b service enum is case-sensitive", { status: 400, code: "VALIDATION_ERROR" }, () =>
  send({ body: baseBody({ service: "Automation" }) }),
);
await test("07 invalid budget enum", { status: 400, code: "VALIDATION_ERROR" }, () =>
  send({ body: baseBody({ budget: "free" }) }),
);
await test("08 invalid timeline enum", { status: 400, code: "VALIDATION_ERROR" }, () =>
  send({ body: baseBody({ timeline: "whenever" }) }),
);

/* 9. Honeypot ------------------------------------------------------------- */
await test(
  "09 honeypot populated returns generic success",
  {
    status: 200,
    ok: true,
    custom: (r) =>
      r.json?.code ? `honeypot leaked a code: ${r.json.code}` : null,
  },
  () => send({ body: baseBody({ website: "http://spam.example" }) }),
);

await test(
  "09b honeypot populated + otherwise invalid still returns generic success",
  { status: 200, ok: true },
  () => send({ body: baseBody({ name: "", website: "x" }) }),
);

await test(
  "09c honeypot whitespace only is treated as empty",
  { status: 200, ok: true, custom: () => null },
  () => send({ body: baseBody({ website: "   " }) }),
);

/* 10. Malformed payloads -------------------------------------------------- */
await test("10 malformed JSON", { status: 400, code: "INVALID_PAYLOAD" }, () =>
  send({ raw: "{ this is not json" }),
);
await test("10b JSON array instead of object", { status: 400, code: "INVALID_PAYLOAD" }, () =>
  send({ raw: '[{"name":"x"}]' }),
);
await test("10c JSON null", { status: 400, code: "INVALID_PAYLOAD" }, () =>
  send({ raw: "null" }),
);
await test("10d empty body", { status: 400, code: "INVALID_PAYLOAD" }, () =>
  send({ raw: "" }),
);

/* 11. Media type ---------------------------------------------------------- */
await test("11 wrong content type (text/plain)", { status: 415, code: "UNSUPPORTED_MEDIA_TYPE" }, () =>
  send({ raw: JSON.stringify(baseBody()), contentType: "text/plain" }),
);
await test("11b missing content type", { status: 415, code: "UNSUPPORTED_MEDIA_TYPE" }, () =>
  send({ raw: JSON.stringify(baseBody()), contentType: null }),
);

/* 12. Oversized payload --------------------------------------------------- */
await test(
  "12 oversized payload (>16KB)",
  { status: 413, code: "PAYLOAD_TOO_LARGE" },
  () => send({ body: baseBody({ details: "G".repeat(17000) }) }),
);

await test(
  "12b oversized payload with no Content-Length (stream enforcement)",
  { status: 413, code: "PAYLOAD_TOO_LARGE" },
  async () => {
    const payload = JSON.stringify(baseBody({ details: "H".repeat(17000) }));
    const stream = new ReadableStream({
      start(controller) {
        // Chunked so no Content-Length is emitted.
        controller.enqueue(new TextEncoder().encode(payload));
        controller.close();
      },
    });

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": nextIp() },
      body: stream,
      duplex: "half",
    });

    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: response.status, json, text, headers: response.headers };
  },
);

await test(
  "12c maximum legitimate submission (3000 + 1000 chars) is accepted",
  { status: 200, ok: true },
  () => send({ body: baseBody({ details: "I".repeat(3000), problem: "J".repeat(1000) }) }),
);

/* 13. Rate limiting ------------------------------------------------------- */
const rlIp = "10.255.0.7";
console.log(dim("      (rate limit probe: expect 5 x 200 then 429)"));

for (let i = 1; i <= 5; i += 1) {
  await test(`13.${i} rate limit request ${i}/5`, { status: 200, ok: true }, () =>
    send({ body: baseBody(), ip: rlIp }),
  );
}

await test(
  "13.6 sixth attempt is rate limited",
  {
    status: 429,
    code: "RATE_LIMITED",
    header: {},
    custom: (r) => {
      const retry = r.headers.get("retry-after");
      if (!retry) return "missing Retry-After header";
      if (!/^\d+$/.test(retry)) return `Retry-After is not numeric: ${retry}`;
      return null;
    },
  },
  () => send({ body: baseBody(), ip: rlIp }),
);

await test(
  "13.7 rate limit is per identifier (different IP still allowed)",
  { status: 200, ok: true },
  () => send({ body: baseBody(), ip: "10.255.0.8" }),
);

await test(
  "13.8 rate limit does not leak internal details",
  {
    status: 429,
    custom: (r) =>
      /memory|counter|window|node|redis|identifier/i.test(r.text)
        ? `429 body leaks internals: ${truncate(r.text)}`
        : null,
  },
  () => send({ body: baseBody(), ip: rlIp }),
);

/* 14. Method handling ----------------------------------------------------- */
await test("14 GET is refused with 405 and an Allow header", {
  status: 405,
  custom: (r) => (r.headers.get("allow") === "POST" ? null : `Allow header = ${r.headers.get("allow")}`),
}, () => send({ method: "GET", contentType: null }));

/* 16. Hostile input ------------------------------------------------------- */
await test("16 HTML tags in name", { status: 200, ok: true }, () =>
  send({ body: baseBody({ name: '<script>alert("test")</script>' }) }),
);
await test("16b HTML tags and ampersand in details", { status: 200, ok: true }, () =>
  send({
    body: baseBody({ details: '<b>Example</b> Tom & Jerry <img src=x onerror=alert(1)>' }),
  }),
);
await test("16c HTML in current problem", { status: 200, ok: true }, () =>
  send({ body: baseBody({ problem: 'Tom & Jerry <b>bold</b> "quoted" \'single\'' }) }),
);
await test("16d CRLF header injection attempt in name", { status: 200, ok: true }, () =>
  send({ body: baseBody({ name: "Evil\r\nBcc: attacker@evil.example" }) }),
);
await test("16e unknown extra fields are ignored", { status: 200, ok: true }, () =>
  send({ body: { ...baseBody(), isAdmin: true, role: "root" } }),
);

/* 17. Rapid parallel submissions ------------------------------------------ */
await test(
  "17 eight rapid parallel submissions all succeed (distinct identifiers)",
  {
    custom: async (r) => {
      const statuses = r.statuses ?? [];
      const ok = statuses.filter((s) => s === 200).length;
      return ok === 8 ? null : `got ${JSON.stringify(statuses)}`;
    },
  },
  async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        send({
          body: baseBody({
            name: `Parallel ${i}`,
            email: `parallel${i}@test.example`,
            problem: "Parallel submission verification payload.",
            details: "Parallel submission verification payload detail.",
          }),
          ip: `172.31.0.${i + 1}`,
        }),
      ),
    );

    return {
      status: results[0].status,
      json: results[0].json,
      text: results[0].text,
      headers: results[0].headers,
      statuses: results.map((r) => r.status),
    };
  },
);

console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
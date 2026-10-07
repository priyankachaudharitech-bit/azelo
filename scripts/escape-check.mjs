/**
 * Verifies that visitor-supplied values are escaped in the HTML email body.
 *
 * Development QA only. Runs the real `escapeHtml` / `renderInquiryEmail` from
 * `src/lib/inquiry/html.ts` via Node's native TypeScript type stripping.
 *
 * Usage: node scripts/escape-check.mjs
 */

import { escapeHtml, headerSafe, renderInquiryEmail } from "../src/lib/inquiry/html.ts";

let passed = 0;
let failed = 0;

const green = (s) => `\u001b[32m${s}\u001b[0m`;
const red = (s) => `\u001b[31m${s}\u001b[0m`;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(green(`PASS  ${name}`));
  } else {
    failed += 1;
    console.log(red(`FAIL  ${name}`));
    if (detail) console.log(`        ${detail}`);
  }
}

console.log("\n=== HTML ESCAPING VERIFICATION ===\n");

/* --- escapeHtml unit behaviour ------------------------------------------- */

const hostile = `<script>alert("test")</script> & <b>bold</b> 'single' "double"`;
const escaped = escapeHtml(hostile);

check(
  "escapeHtml removes every angle bracket",
  !escaped.includes("<") && !escaped.includes(">"),
  escaped,
);
check("escapeHtml escapes & first", escaped.includes("&amp;"), escaped);
check("escapeHtml escapes double quotes", escaped.includes("&quot;"), escaped);
check("escapeHtml escapes single quotes", escaped.includes("&#39;"), escaped);
check(
  "escapeHtml escapes ampersand without double-escaping",
  !escaped.includes("&amp;amp;"),
  escaped,
);
check(
  "escapeHtml leaves safe text untouched",
  escapeHtml("North Harbor Studio") === "North Harbor Studio",
);

/* --- headerSafe unit behaviour ------------------------------------------- */

check(
  "headerSafe collapses CRLF to a single space",
  headerSafe("Evil\r\nBcc: attacker@evil.example") ===
    "Evil Bcc: attacker@evil.example",
  headerSafe("Evil\r\nBcc: attacker@evil.example"),
);
check(
  "headerSafe strips control characters",
  headerSafe("a\u0000b\u0007c") === "abc",
  JSON.stringify(headerSafe("a\u0000b\u0007c")),
);
check(
  "headerSafe removes tab characters",
  !headerSafe("a\tb").includes("\t"),
  JSON.stringify(headerSafe("a\tb")),
);

/* --- Full email render ---------------------------------------------------- */

const payload = {
  name: '<script>alert("test")</script>',
  email: "dana@northharbor.example",
  company: "North Harbor & Co",
  serviceLabel: "Workflow automation",
  budgetLabel: "3,000 – 7,500",
  timelineLabel: "In 1–3 months",
  problem: 'Tom & Jerry <b>bold</b> "quoted" \'single\' <img src=x onerror=alert(1)>',
  details:
    '<b>Example</b> Tom & Jerry <svg/onload=alert(1)> &amp; already-escaped-looking text',
  timestamp: "2026-10-02T12:00:00.000Z",
};

const email = renderInquiryEmail(payload);

/* The HTML part must contain no raw markup from user input. */
const bodyOnly = email.html.slice(email.html.indexOf("<table role=\"presentation\" width=\"100%\""));

check(
  "rendered HTML contains no raw <script> tag",
  !bodyOnly.includes("<script"),
  "raw script tag present",
);
check(
  "rendered HTML contains no raw <img> tag",
  !bodyOnly.includes("<img"),
  "raw img tag present",
);
check(
  "rendered HTML contains no raw <svg> tag",
  !bodyOnly.includes("<svg"),
  "raw svg tag present",
);
check(
  "rendered HTML contains the escaped script payload",
  bodyOnly.includes("&lt;script&gt;"),
  "escaped payload missing",
);
check(
  "rendered HTML escapes the ampersand in 'Tom & Jerry'",
  bodyOnly.includes("Tom &amp; Jerry"),
  "ampersand not escaped",
);
check(
  "rendered HTML escapes the ampersand in the company name",
  bodyOnly.includes("North Harbor &amp; Co"),
  "company ampersand not escaped",
);
check(
  "rendered HTML escapes event-handler payloads",
  bodyOnly.includes("onerror=alert(1)") && bodyOnly.includes("&lt;img"),
  "event handler payload not neutralised",
);

/* The subject must be header-safe. */
check(
  "subject uses the service label and name",
  email.subject === "New Project Inquiry — Workflow automation — <script>alert(\"test\")</script>",
  email.subject,
);
check(
  "subject contains no CR or LF",
  !email.subject.includes("\r") && !email.subject.includes("\n"),
  JSON.stringify(email.subject),
);

check(
  "plain-text part preserves the original characters verbatim",
  email.text.includes('Tom & Jerry <b>bold</b>'),
  "plain text altered",
);
check(
  "plain-text part contains every inquiry field",
  [
    "Name:",
    "Company:",
    "Email:",
    "Service:",
    "Budget range:",
    "Timeline:",
    "Current problem",
    "Project details",
    "Received:",
  ].every((label) => email.text.includes(label)),
  "missing field label",
);

console.log(
  `\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`,
);

process.exit(failed > 0 ? 1 : 0);
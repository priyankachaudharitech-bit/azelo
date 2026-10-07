# AZELO — AI Automation & Full-Stack Systems

Production landing page for an independent AI, automation and full-stack digital
solutions brand focused on building practical systems for modern businesses:
lead capture, workflow automation, AI voice workflows, prospect research
delivery and business reporting.

**Brand working name:** AZELO

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind
CSS v4 · Zod. No UI framework, no animation library, no email SDK.

---

## Contents

- [Quick start](#quick-start)
- [Commands](#commands)
- [Architecture](#architecture)
- [Content](#content)
- [Inquiry pipeline](#inquiry-pipeline)
- [Environment variables](#environment-variables)
- [Email configuration](#email-configuration)
- [Rate limiting](#rate-limiting)
- [Local API testing](#local-api-testing)
- [Future n8n integration](#future-n8n-integration)
- [Secrets and owner configuration](#secrets-and-owner-configuration)
- [Deployment](#deployment)
- [Project structure](#project-structure)

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional for local dev
npm run dev
```

Open <http://localhost:3000>.

**No environment variables are required to run locally.** With no configuration
the inquiry endpoint uses a console email provider and prints the rendered email
to the server log, so the full form flow is testable offline.

Requires Node.js 22 or newer (built and verified on Node 24).

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` |
| `node scripts/api-tests.mjs` | Inquiry API suite (42 cases, server must be running) |
| `node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/limiter-tests.mjs` | Rate limiter suite (53 cases, no server needed) |
| `node --experimental-strip-types scripts/escape-check.mjs` | HTML escaping verification (20 cases) |

All three of `lint`, `typecheck` and `build` must pass before deploying.
`scripts/ts-resolve.mjs` exists only so Node can load the app's TypeScript
directly; it adds no resolver behaviour to the application.

---

## Architecture

```
Browser
  └─ InquiryForm (client)  ── validates with the shared Zod schema
       └─ POST /api/inquiry
            ├─ media-type check          → 415
            ├─ rate limit                → 429 / 503
            ├─ body size / JSON parse    → 413 / 400
            ├─ honeypot                  → silent 200, no email
            ├─ Zod validation            → 400 + fieldErrors
            ├─ provider resolution       → 500 if misconfigured
            └─ email provider
                 ├─ ConsoleEmailProvider  (development only)
                 └─ ResendEmailProvider   (production, native fetch)
```

**Rendering.** The entire page is Server Components except two files:

- `src/components/layout/Navbar.tsx` — needs open/closed state, Escape
  handling, focus management and scroll locking.
- `src/components/forms/InquiryForm.tsx` — needs controlled state, async
  submission and accessible result announcement.

The hero workflow animation and the FAQ are CSS and native `<details>`; neither
requires JavaScript.

---

## Content

All editable business content lives in **`src/lib/content.ts`** — navigation,
hero, pain points, services, outcomes, process, projects, technology, about, FAQ
and footer. It is fully typed, so a content edit that breaks the data shape
fails `npm run typecheck`.

Inquiry options (services, budget bands, timelines) and field limits live in
**`src/lib/inquiry/config.ts`**, shared by the form and the API route. Budget
bands ship with `configured: false`, so none render publicly until the owner
supplies real bands — see `OWNER_CONFIG.md`.

---

## Inquiry pipeline

### Fields

| Field | Required | Rules |
|---|---|---|
| Name | yes | 2–100 characters, trimmed |
| Work email | yes | valid email, max 254 characters |
| Company | no | max 150 characters |
| Service needed | yes | controlled enum |
| Current problem | yes | max 1000 characters |
| Budget range | yes | controlled enum |
| Desired timeline | yes | controlled enum |
| Project details | yes | max 3000 characters |
| `website` (honeypot) | — | must be empty; visually hidden, out of tab order |

Service, budget and timeline are enums. Arbitrary strings are rejected on the
server, and the enum values are derived from `config.ts` so the form options and
the schema cannot drift apart.

### Single source of truth for validation

`src/lib/inquiry/schema.ts` exports one Zod schema, imported by both the client
form and the API route. There is no second validation definition. Client-side
validation is a convenience — the server revalidates everything and its response
always wins.

Text is trimmed, never silently truncated. Over-limit input is rejected with a
field-level message.

### Request safeguards

Applied in this order:

1. **Media type** — must include `application/json`, else `415`.
2. **Rate limit** — before parsing, so malformed floods are bounded too. `429`
   when the window is exhausted, `503` when the limiter itself cannot be reached
   (fail-closed by default).
3. **Body size** — `Content-Length` is checked as a cheap fast reject, but is not
   trusted. The body is then read from the stream while counting bytes, and the
   stream is cancelled the instant the 16 KB limit is passed, so an oversized
   upload is never fully buffered. `413` on violation.
4. **JSON parse** — malformed, non-object and empty bodies return `400`.
5. **Honeypot** — filled means the submission is discarded silently with the same
   `{"ok": true}` shape a real submission returns. No email is sent and no
   `code` is returned, so a bot learns nothing.
6. **Validation** — `400` with `fieldErrors`.
7. **Delivery** — success is reported **only** if the configured provider
   accepted the message. A provider failure returns `500` and never claims the
   message was sent.

### Response contract

```jsonc
// 200
{ "ok": true }

// 400 / 413 / 415 / 429 / 500
{ "ok": false, "code": "VALIDATION_ERROR", "fieldErrors": { "email": "…" } }
```

Codes: `VALIDATION_ERROR`, `INVALID_PAYLOAD`, `PAYLOAD_TOO_LARGE`,
`UNSUPPORTED_MEDIA_TYPE`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`,
`SUBMISSION_FAILED`.

No stack traces, provider payloads, API keys or internal exception messages are
ever returned to the browser.

---

## Environment variables

Copy `.env.example` to `.env.local`. Values are read at runtime only — a missing
value never breaks `npm run build`.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | production | Canonical origin for metadata, sitemap and robots |
| `EMAIL_PROVIDER` | production (`resend`) | `console` (development) or `resend` |
| `RESEND_API_KEY` | production | Resend API key |
| `INQUIRY_TO_EMAIL` | production | Inbox that receives inquiries |
| `INQUIRY_FROM_EMAIL` | production | Verified sender address |
| `UPSTASH_REDIS_REST_URL` | production | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | production | Upstash Redis REST token |
| `RATE_LIMIT_MAX` | no | Requests per window (default `5`) |
| `RATE_LIMIT_WINDOW_SECONDS` | no | Window length (default `600`) |
| `RATE_LIMIT_FAIL_OPEN` | no | `false` (default) fails closed; `true` fails open |
| `RATE_LIMIT_UPSTASH_TIMEOUT_MS` | no | Upstash timeout (default `2000`) |

---

## Email configuration

Two adapters implement the `EmailProvider` interface in
`src/lib/inquiry/email.ts`:

- **`ConsoleEmailProvider`** — prints the rendered email to the server log.
  Refuses to run when `NODE_ENV === "production"`.
- **`ResendEmailProvider`** — POSTs to the Resend REST API using native `fetch`.
  No SDK dependency. 8-second timeout.

**Production requires `EMAIL_PROVIDER=resend`.** There is no silent fallback to
the console adapter. If configuration is missing or wrong, the server logs an
actionable message (e.g. `RESEND_API_KEY is not set`) and the inquiry fails
safely with `500` rather than pretending to deliver.

### Message format

- **Subject:** `New Project Inquiry — {service label} — {name}`
- **From:** the configured verified sender (`INQUIRY_FROM_EMAIL`)
- **Reply-To:** the visitor's validated email
- **To:** `INQUIRY_TO_EMAIL`
- **Body:** HTML + plain-text alternative, both containing name, company, email,
  service, current problem, budget, timeline, project details and timestamp

### Escaping

Every visitor-supplied value passes through `escapeHtml()` before reaching the
HTML body. `dangerouslySetInnerHTML` is never used. Values placed in the subject
or `Reply-To` additionally pass through `headerSafe()`, which strips control
characters and collapses newlines so header injection is not possible.

Verify with:

```bash
node --experimental-strip-types scripts/escape-check.mjs
```

---

## Rate limiting

Two implementations sit behind one interface. Selection is automatic:

| Environment | Implementation | Why |
|---|---|---|
| Development / tests | `InMemoryRateLimiter` | No setup required. Process-local, single-process only. |
| Production **with** Upstash configured | `UpstashRateLimiter` | Persistent, shared across every instance. |
| Production **without** Upstash configured | `UnavailableRateLimiter` | **Refuses submissions (503).** Never falls back to in-memory. |

> The in-memory limiter is **not** a production rate limiter. Counters live in
> the Node heap: serverless cold starts reset them, concurrent instances each
> enforce an independent limit, and a restart clears everything. That is exactly
> why production refuses to use it.

### Algorithm — fixed window, atomic

A single Redis `EVAL` runs this Lua script server-side:

```lua
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
return { count, ttl }
```

Redis executes Lua atomically, so the increment, the conditional expiry and the
TTL read cannot interleave with a competing request. This deliberately avoids
the racy read-then-write pattern of a naive `GET` → increment → `SET` flow, and
it costs exactly **one network round trip** — not a multi-command pipeline that
could be observed mid-sequence.

The expiry is set only on the first increment of a window, so a burst cannot
extend the window indefinitely.

### Failure policy

| `RATE_LIMIT_FAIL_OPEN` | Behaviour when the limiter cannot be reached |
|---|---|
| unset / `false` *(default)* | **Fail closed.** `503` with a generic message. Logged as a category only. |
| `true` | Fail open. The request proceeds and the bypass is logged every time. |

Failing closed is the default because an unavailable limiter must never silently
become an unlimited one. Opting into fail-open means losing a genuine inquiry is
worse for you than the extra spam exposure — pair it with a CAPTCHA or an
upstream filter if you choose it.

### Client identifier and privacy

Raw addresses are never stored. The identifier is **SHA-256 hashed**, truncated
to 32 hex characters, namespaced `inquiry:rl:`, and expires with the window. The
hash is never returned to the client, logged in full, or included in any email.
No cookies, no device fingerprinting, no user-agent signals.

**Proxy headers are not intrinsically trustworthy.** `readClientIdentifier()`
reads the left-most `x-forwarded-for` entry, which is correct on managed
platforms (Vercel, Cloudflare, Fly, Railway) where the edge overwrites the
header. On a self-hosted server behind nginx, `proxy_add_x_forwarded_for`
*appends* to a client-supplied value, so the left-most entry can be spoofed —
configure `proxy_set_header X-Forwarded-For $remote_addr;` or read the last entry
instead. `readClientIdentifier()` is the single place this decision lives.

### Replacing the limiter

Implement the interface and return it from `createRateLimiter()` in
`src/lib/inquiry/rate-limit.ts`. The route depends on the interface only.

```ts
export interface RateLimiter {
  readonly name: string;
  check(key: string): Promise<RateLimitResult>;
}
```

`RateLimitResult` is `allowed`, `limited`, or `unavailable`. The third state is
what makes the failure policy possible: the route never has to guess whether an
error meant "allowed" or "denied".

---

## Resend production checklist

Email delivery is **not** configured until you complete this. No real credentials
belong in source control.

1. Create a Resend account at <https://resend.com>.
2. Add your sending domain and complete DNS verification.
3. Create an API key (restricted to sending only).
4. Set `INQUIRY_FROM_EMAIL` to an address on the verified domain.
5. Set `INQUIRY_TO_EMAIL` to the inbox that should receive inquiries.
6. Set `EMAIL_PROVIDER=resend`.
7. Add `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_TO_EMAIL` and
   `EMAIL_PROVIDER` to your deployment environment.
8. Deploy, then submit one real inquiry through the live form.
9. Confirm the email arrives in the destination inbox.
10. Confirm `Reply-To` shows the address the visitor typed.

Until step 9 succeeds, treat delivery as unverified.

---

## Local API testing

Start a server, then run the suite:

```bash
npm run dev                       # terminal 1
node scripts/api-tests.mjs        # terminal 2
```

The suite covers valid submission, empty and invalid fields, every length limit
and its boundary, invalid enums, honeypot variants, malformed JSON, wrong media
type, oversized payloads (with and without `Content-Length`), rate-limit
rejection, method handling, and hostile HTML/header-injection input.

To exercise rate limiting quickly:

```bash
RATE_LIMIT_MAX=3 RATE_LIMIT_WINDOW_SECONDS=60 npm run dev
```

---

## Future n8n integration

The pipeline is deliberately shaped so an n8n webhook can be inserted without
touching the route or the form:

```
Website → validation → email → [optional n8n webhook] → CRM / Google Sheet / automation
```

To add it later:

1. Create an `N8nWebhookProvider` (or a notifier interface) alongside the
   existing email providers in `src/lib/inquiry/email.ts`.
2. Call it **after** `sendInquiry()` succeeds, so email delivery stays
   independently understandable and a webhook outage cannot lose an inquiry.
3. Log webhook failures as a category only, and do not change the success
   response.

No webhook environment variable has been created yet — add it at that point.

---

## Secrets and owner configuration

Three files, three clearly separated concerns:

| File | Contains | Never contains |
|---|---|---|
| **`OWNER_CONFIG.md`** | Public and business information you supply: name, public email, domain, currency, budget bands, profiles, confirmed technologies | **Any secret.** No API keys, no tokens, no passwords. |
| **`.env.example`** | Variable names and safe placeholder values | Real values |
| **`.env.local` / deployment env** | Real secrets: `RESEND_API_KEY`, `UPSTASH_REDIS_REST_TOKEN` | Anything meant to be committed |

`OWNER_CONFIG.md` is the checklist of what the site needs from you before
launch. Secrets belong exclusively in `.env.local` locally and in your hosting
platform's environment settings in production.

**No variable that holds a secret may use a `NEXT_PUBLIC_` prefix** — that would
ship it to the browser. `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` are read only in `src/lib/inquiry/rate-limit.ts`, and
a test asserts they appear nowhere in client code.

### Public email vs delivery inbox

These are different things and are configured separately:

- **Public contact email** — `site.email` in `src/lib/content.ts`. Rendered in
  the footer as a `mailto:` link. While it is `null`, nothing renders.
- **Delivery inbox** — the `INQUIRY_TO_EMAIL` deployment variable. Never shown
  on the site.

---

## Deployment

1. Set `NEXT_PUBLIC_SITE_URL` to the real production domain.
2. Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` and
   `INQUIRY_FROM_EMAIL` — see the Resend checklist above.
3. Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   **Without these, every inquiry returns 503 by design.**
4. Run `npm run lint && npm run typecheck && npm run build`.
5. Deploy `.next`.

Review `OWNER_CONFIG.md` before launch — budget bands, technology claims, About
copy and the public email all still need your input.

## Production launch checklist

Complete each step before treating the site as production-ready:

1. Choose compliant commercial hosting (Vercel Hobby/free is NOT approved for
   commercial production).
2. Obtain a valid production URL / custom domain if desired.
3. Configure `NEXT_PUBLIC_SITE_URL` in your deployment environment.
4. Provision an Upstash Redis database.
5. Configure server-only Upstash env vars (`UPSTASH_REDIS_REST_URL`,
   `UPSTASH_REDIS_REST_TOKEN`).
6. Configure Resend with a verified sending domain.
7. Set `INQUIRY_FROM_EMAIL` to a verified sender on the verified domain.
8. Set `INQUIRY_TO_EMAIL` and `EMAIL_PROVIDER=resend`.
9. Deploy to your chosen platform.
10. Submit one real enquiry through the live form.
11. Verify inbox delivery arrives in the destination inbox.
12. Verify `Reply-To` shows the address the visitor typed.
13. Verify rate limiting is enforced on the deployed URL.
14. Verify metadata, Open Graph image and sitemap on the deployed URL.
15. Run final accessibility and performance inspection.

---

## Project structure

```
src/
├─ app/
│  ├─ api/inquiry/route.ts     POST endpoint and safeguards
│  ├─ globals.css              design tokens, base layer, animations
│  ├─ layout.tsx               fonts, metadata, viewport
│  └─ page.tsx                 section composition
├─ components/
│  ├─ forms/InquiryForm.tsx    client component
│  ├─ layout/                  Container, Navbar, Footer
│  ├─ sections/                all page sections
│  └─ ui/                      Button, Badge, Card, Section, SectionHeading
└─ lib/
   ├─ cn.ts                    class-name joiner
   ├─ content.ts               all editable business content
   └─ inquiry/
      ├─ config.ts             enums, limits, rate-limit policy
      ├─ schema.ts             the single Zod schema
      ├─ html.ts               escapeHtml, headerSafe, email rendering
      ├─ email.ts              EmailProvider interface + adapters
      └─ rate-limit.ts         RateLimiter interface + in-memory adapter
scripts/
├─ api-tests.mjs               API test suite
└─ escape-check.mjs            HTML escaping verification
```
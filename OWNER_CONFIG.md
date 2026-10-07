# Owner configuration checklist

Everything the site needs from you before it can go live, in one place.

**This file contains public and business information only.**

**Do not put API keys, tokens or passwords here.** `RESEND_API_KEY`,
`UPSTASH_REDIS_REST_TOKEN` and every other secret belong in your deployment
platform's environment-variable settings and in `.env.local` locally. They are
deliberately absent from this document.

Status key: **CONFIRMED** = supplied and set · **NOT PROVIDED** = not supplied · **PLANNED** = intended but not yet active · **NOT VERIFIED** = unknown · **LAUNCH BLOCKER** = must be resolved before going live.

---

## IDENTITY

| Item | Status | Where it appears | Notes / example format |
|---|---|---|---|
| Brand / working name | CONFIRMED | Navbar, footer, page metadata | AZELO |
| Website display name | CONFIRMED | Browser/SEO title, OG | AZELO |
| Professional positioning | CONFIRMED | Meta, footer, OG | AI Automation & Full-Stack Systems |
| Public email | CONFIRMED | Footer, contact fallback | priyankachaudhari.tech@gmail.com |
| Inquiry delivery email | CONFIRMED | Server route destination | priyankachaudhari.tech@gmail.com |
| Location / timezone | NOT PROVIDED | Optional — not published | Nothing is displayed today. |
| LinkedIn | NOT PROVIDED | Footer if URL supplied | No URL supplied. |
| GitHub | NOT PROVIDED | Footer if URL supplied | No URL supplied. |

## DOMAIN

| Item | Status | Where it appears | Notes |
|---|---|---|---|
| Production URL | NOT PROVIDED | Canonical tags, Open Graph, sitemap, robots | `NEXT_PUBLIC_SITE_URL`. No fake fallback URL is published in production metadata. |
| Custom domain | NOT PURCHASED | Hosting | No domain has been purchased. |
| Hosting platform | NOT VERIFIED | Rate-limit trust model, proxy headers | Vercel-compatible. Vercel Hobby/free is NOT approved as commercial production hosting. |
| Production hosting | LAUNCH BLOCKER | Deployment | Choose a compliant commercial hosting plan before launch. |

## BUSINESS

| Item | Status | Where it appears | Notes |
|---|---|---|---|
| Currency | NOT PROVIDED | Budget bands only | Owner has not specified INR, USD or other currency. No fake bands are shown. |
| Budget bands | NOT PROVIDED | Inquiry form select | All bands remain hidden. Form offers only "Not sure yet". |
| Project types | CONFIRMED | Inquiry form select | `SERVICE_OPTIONS` matches the brief. |
| Budget policy | NOT PROVIDED | — | Decide whether budget should be required at all. |

## PROFILES

No social profile URLs are supplied. The footer renders no social row until real
URLs are provided — no placeholder profiles are shown.

| Item | Status | Example format |
|---|---|---|
| LinkedIn | NOT PROVIDED | `https://www.linkedin.com/in/your-handle` |
| GitHub | NOT PROVIDED | `https://github.com/your-handle` |
| Other | NOT PROVIDED *(optional)* | Portfolio, Dribbble, anything actually maintained |

## TECHNOLOGY

`src/lib/content.ts` → `technology.groups`. Each entry carries a `verified`
flag. **Inference is not evidence of ability**, so anything derived from the
service list rather than owner confirmation is hidden when
`technology.onlyShowVerified: true`.

**Confirmed from the business brief** (rendered with `verified: true`):
REST APIs · Webhooks · n8n · Scheduled jobs · Email delivery · LLM API
integration · Voice APIs · Structured extraction · Excel · CSV

**Owner-confirmed technologies** (rendered only after Phase 5 update):
Next.js · React · TypeScript · Tailwind CSS · Node.js · Git

**Removed from public site:**
PostgreSQL · Python · SQL · Power BI · CI/CD · Serverless hosting

## ABOUT

| Item | Status | Where it appears | Notes |
|---|---|---|---|
| About copy | CONFIRMED | About section | `src/lib/content.ts` → `about.paragraphs`. Updated for AZELO brand positioning. |
| Working-across list | CONFIRMED | About section | `about.workingAcross`. Updated. |
| Years of experience | NOT PROVIDED | — | Not asserted. |
| Number of clients | NOT PROVIDED | — | Not asserted. |
| Certifications / degrees | NOT PROVIDED | — | Not asserted. |
| Location | NOT PROVIDED | — | Not published. |

## PROOF

| Item | Status | Notes |
|---|---|---|
| Real projects | NOT PROVIDED | Three demo/concept projects remain. No client case studies are published. |
| Screenshots / video | NOT PROVIDED *(optional)* | No stock imagery is used anywhere. |
| Testimonials | NOT PROVIDED *(optional)* | None are shown. |
| Measurable results | NOT PROVIDED *(optional)* | No numbers, percentages or revenue claims are published. |

## INFRASTRUCTURE

| Item | Status | Where | Notes |
|---|---|---|---|
| Resend account | NOT VERIFIED | `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` | Not yet configured or verified. Delivery status: NOT VERIFIED. |
| Upstash Redis database | NOT PROVISIONED | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Production inquiry submission is BLOCKED until configured. |
| Deployment env vars set | LAUNCH BLOCKER | Platform environment | All of the above plus `NEXT_PUBLIC_SITE_URL`. |
| `INQUIRY_FROM_EMAIL` | NOT SET | Server-only env | Must be set to a verified sender on a verified domain. Do NOT use `priyankachaudhari.tech@gmail.com` unless the provider explicitly supports it. |

---

## Production inquiry behavior

| Condition | Behavior |
|---|---|
| Production + Upstash configured | Rate-limited submissions allowed |
| Production + NO Upstash | 503, never unlimited fallback |
| Production + `RATE_LIMIT_FAIL_OPEN=true` | Allows requests but logs bypass |
| Development | Console provider, in-memory limiter |

---

## Launch blockers

The following MUST be resolved before the site can go to commercial production:

1. Choose compliant commercial hosting (Vercel Hobby/free is NOT approved for commercial production).
2. Obtain a valid production URL / custom domain.
3. Configure `NEXT_PUBLIC_SITE_URL`.
4. Provision Upstash Redis.
5. Configure server-only Upstash env vars.
6. Configure Resend with verified sender/domain.
7. Set `INQUIRY_FROM_EMAIL` to a verified sender.
8. Set `INQUIRY_TO_EMAIL` and `EMAIL_PROVIDER=resend`.
9. Deploy.
10. Submit one real enquiry.
11. Verify inbox delivery.
12. Verify Reply-To.
13. Verify rate limiting.
14. Verify metadata / OG image on deployed URL.
15. Run final accessibility/performance inspection.

---

## Proxy header assumption

`src/lib/inquiry/rate-limit.ts` reads the **left-most** `x-forwarded-for` entry.
That is correct on managed platforms (Vercel, Cloudflare, Fly, Railway), where
the edge overwrites the header with the real client address.

**If you self-host behind nginx**, the default `proxy_add_x_forwarded_for`
*appends* to a client-supplied header, so the left-most entry can be spoofed.
Either configure nginx to overwrite it:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
```

or change `readClientIdentifier()` to read the **last** entry instead. Tell me
your hosting choice and I will set this correctly.

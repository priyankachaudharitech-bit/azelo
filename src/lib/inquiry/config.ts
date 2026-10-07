/**
 * Owner-configurable inquiry configuration.
 *
 * This module is the single source of truth for the option sets, limits and
 * rate-limit policy used by BOTH the client form and the server route, so the
 * two can never drift apart.
 *
 * OWNER-CONFIGURABLE: budget labels below are deliberately currency-neutral.
 * Replace the `label` strings with your own currency and bands before launch —
 * the values are stable identifiers and changing a label is safe.
 */

export type InquiryOption = {
  /** Stable machine value. Never change these once the site is live. */
  value: string;
  /** Human label shown in the form and in the notification email. */
  label: string;
  /**
   * Whether the owner has confirmed this label for public display.
   *
   * `false` means the value is still accepted by the API — so nothing already
   * integrated breaks — but it is NOT rendered in the public form.
   */
  configured: boolean;
};

export const SERVICE_OPTIONS = [
  { value: "web-development", label: "Web experience or application", configured: true },
  { value: "automation", label: "Workflow automation", configured: true },
  { value: "voice-agent", label: "AI voice workflow", configured: true },
  { value: "lead-research", label: "Prospect research delivery", configured: true },
  { value: "data-analysis", label: "Data analysis and reporting", configured: true },
  { value: "ai-integration", label: "AI / API integration", configured: true },
  { value: "other", label: "Something else / not sure yet", configured: true },
] as const satisfies readonly InquiryOption[];

/**
 * OWNER-CONFIGURABLE — BUDGET BANDS.
 *
 * Currency and bands are a business decision, not an inference. Every band below
 * is `configured: false`, so NONE of them render on the public site. The form
 * offers only the always-available "Not sure yet" option until you:
 *
 *   1. Pick your currency.
 *   2. Write the real bands into `label`.
 *   3. Set `configured: true` on each band you want to publish.
 *
 * Steps 1-3 are listed in OWNER_CONFIG.md. The stable `value` keys never change,
 * so submissions recorded against a band keep working.
 */
export const BUDGET_OPTIONS = [
  { value: "under-1k", label: "", configured: false },
  { value: "1k-3k", label: "", configured: false },
  { value: "3k-7-5k", label: "", configured: false },
  { value: "7-5k-15k", label: "", configured: false },
  { value: "15k-plus", label: "", configured: false },
  { value: "not-defined", label: "Not sure yet", configured: true },
] as const satisfies readonly InquiryOption[];

/** Options safe to render publicly. */
export function publicOptions(
  options: readonly InquiryOption[],
): readonly InquiryOption[] {
  return options.filter((option) => option.configured && option.label.length > 0);
}

export const TIMELINE_OPTIONS = [
  { value: "asap", label: "As soon as possible", configured: true },
  { value: "within-1-month", label: "Within 1 month", configured: true },
  { value: "1-3-months", label: "In 1–3 months", configured: true },
  { value: "3-plus-months", label: "In 3+ months", configured: true },
  { value: "exploring", label: "Still exploring", configured: true },
] as const satisfies readonly InquiryOption[];

/** Maximum accepted length per field, enforced on client and server alike. */
export const FIELD_LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  company: { max: 150 },
  problem: { max: 1000 },
  details: { max: 3000 },
  /** Honeypot is never expected to hold anything. */
  honeypot: { max: 200 },
} as const;

/**
 * Maximum accepted request body.
 *
 * 16 KB is generous for this form: the largest field is 3000 characters and
 * JSON escaping rarely doubles that, so a complete legitimate submission is
 * typically under 10 KB.
 */
export const MAX_BODY_BYTES = 16 * 1024;

/**
 * IN-MEMORY RATE LIMIT POLICY (development + tests only).
 *
 * Production uses the persistent Upstash limiter and the same policy values.
 * Override via environment only to test the endpoint quickly.
 */
export const RATE_LIMIT_DEFAULTS = {
  max: 5,
  windowSeconds: 600,
} as const;

/**
 * Resolves a machine value to its human label.
 *
 * Unconfigured budget bands fall back to the neutral "Not sure yet" wording
 * rather than printing an empty or invented label in the notification email.
 */
export function optionLabel(
  options: readonly InquiryOption[],
  value: string,
): string {
  const match = options.find((option) => option.value === value);

  if (!match || !match.configured || match.label.length === 0) {
    return "Not specified";
  }

  return match.label;
}

/** Human label for a service value. */
export function serviceLabel(value: string): string {
  return optionLabel(SERVICE_OPTIONS, value);
}
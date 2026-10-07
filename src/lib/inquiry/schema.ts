import { z } from "zod";

import {
  BUDGET_OPTIONS,
  FIELD_LIMITS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
} from "./config";

/**
 * The one authoritative inquiry schema.
 *
 * Imported by BOTH the client form and the server route. Client validation is a
 * convenience; the server parse is the only thing that is trusted.
 *
 * Enum values are derived from `config.ts` so the option lists and the schema
 * cannot drift apart.
 */

function toEnumValues<T extends readonly { value: string }[]>(
  options: T,
): [string, ...string[]] {
  return options.map((option) => option.value) as [string, ...string[]];
}

/** Free text: trimmed, length-bounded, no silent truncation. */
const boundedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message);

export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(FIELD_LIMITS.name.min, "Enter at least 2 characters.")
    .max(FIELD_LIMITS.name.max, `Keep this under ${FIELD_LIMITS.name.max} characters.`),

  email: z
    .string()
    .trim()
    .max(FIELD_LIMITS.email.max, "That email address is too long.")
    .pipe(z.email("Enter a valid email address.")),

  company: boundedText(
    FIELD_LIMITS.company.max,
    `Keep this under ${FIELD_LIMITS.company.max} characters.`,
  ).optional(),

  service: z.enum(toEnumValues(SERVICE_OPTIONS), {
    error: "Choose the service you need.",
  }),

  budget: z.enum(toEnumValues(BUDGET_OPTIONS), {
    error: "Choose a budget range.",
  }),

  timeline: z.enum(toEnumValues(TIMELINE_OPTIONS), {
    error: "Choose a timeline.",
  }),

  problem: boundedText(
    FIELD_LIMITS.problem.max,
    `Keep this under ${FIELD_LIMITS.problem.max} characters.`,
  ).min(10, "Describe the current problem in at least 10 characters."),

  details: boundedText(
    FIELD_LIMITS.details.max,
    `Keep this under ${FIELD_LIMITS.details.max} characters.`,
  ).min(10, "Add at least 10 characters of project detail."),

  /**
   * Honeypot. Must be empty. Bounded so a bot cannot smuggle a large payload
   * through this field.
   */
  website: z
    .string()
    .max(FIELD_LIMITS.honeypot.max, "Invalid submission.")
    .optional()
    .default(""),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export type InquiryField = keyof InquiryInput;

/** Field keys the form renders, in DOM order. */
export const INQUIRY_FIELDS: readonly InquiryField[] = [
  "name",
  "email",
  "company",
  "service",
  "problem",
  "budget",
  "timeline",
  "details",
];

export type FieldErrors = Partial<Record<InquiryField, string>>;

export type ParseResult =
  | { success: true; data: InquiryInput }
  | { success: false; fieldErrors: FieldErrors };

/**
 * Parses untrusted input against the schema and flattens issues into a
 * user-friendly `{ field: message }` map. Internal Zod objects never leave
 * this module.
 */
export function parseInquiry(input: unknown): ParseResult {
  const result = inquirySchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: FieldErrors = {};

  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    // First error per field wins — avoids duplicate messages on one input.
    if (!(key in fieldErrors)) {
      fieldErrors[key as InquiryField] = issue.message;
    }
  }

  return { success: false, fieldErrors };
}

/** True when the honeypot was filled — the submission is almost certainly a bot. */
export function isHoneypotTripped(inquiry: Pick<InquiryInput, "website">): boolean {
  return inquiry.website.trim().length > 0;
}
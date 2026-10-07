"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import {
  BUDGET_OPTIONS,
  FIELD_LIMITS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
  publicOptions,
} from "@/lib/inquiry/config";
import { inquirySchema, type FieldErrors, type InquiryField } from "@/lib/inquiry/schema";

/**
 * Client Component — the only reason this file exists.
 *
 * It requires real browser behaviour: controlled field state, inline
 * validation, an async request, and accessible announcement of results. The
 * surrounding Contact section stays a Server Component and passes no state.
 *
 * Validation rules come from the SAME `inquirySchema` the server enforces, so
 * the two cannot disagree. Client validation is a convenience only — the server
 * revalidates everything and its response wins.
 */

type Values = {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  timeline: string;
  problem: string;
  details: string;
  website: string; // honeypot
};

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY: Values = {
  name: "",
  email: "",
  company: "",
  service: "",
  budget: "",
  timeline: "",
  problem: "",
  details: "",
  website: "",
};

const CONTROL =
  "w-full rounded-[var(--radius-md)] border border-hairline-strong bg-surface px-4 py-3 text-base text-text " +
  "transition-colors duration-[var(--duration-fast)] placeholder:text-muted/60 " +
  "hover:border-hairline-strong/80 focus:border-accent focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

/** Messages that are not attached to a single field. */
const FORM_ERRORS = {
  RATE_LIMITED:
    "Too many attempts from this connection. Please wait a few minutes before trying again.",
  PAYLOAD_TOO_LARGE:
    "That submission is too large. Please shorten the project details and resend.",
  UNSUPPORTED_MEDIA_TYPE: "This form could not be submitted. Please contact me directly.",
  INVALID_PAYLOAD: "This form could not be submitted. Please try again.",
  SUBMISSION_FAILED:
    "Your message could not be delivered right now. Please try again, or contact me another way.",
  NETWORK: "The request could not be sent. Check your connection and try again.",
} as const;

export function InquiryForm() {
  const formId = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Partial<Record<InquiryField, HTMLElement | null>>>({});

  const pending = status === "submitting";

  function setField(field: keyof Values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function clearFieldError(field: keyof Values) {
    setFieldErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  /**
   * Runs the shared schema against the current values and returns the errors.
   * `focusFirst` decides whether an invalid submit also moves focus to the
   * summary box.
   */
  function validate(): FieldErrors {
    const result = inquirySchema.safeParse({
      name: values.name,
      email: values.email,
      company: values.company,
      service: values.service,
      budget: values.budget,
      timeline: values.timeline,
      problem: values.problem,
      details: values.details,
      website: values.website,
    });

    if (result.success) return {};

    const errors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key !== "string") continue;
      if (!(key in errors)) errors[key as InquiryField] = issue.message;
    }
    return errors;
  }

  function focusFirstError(errors: FieldErrors) {
    const first = (Object.keys(errors) as InquiryField[]).find(
      (key) => fieldRefs.current[key],
    );
    if (first) {
      fieldRefs.current[first]?.focus();
    } else {
      summaryRef.current?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setFormError(null);

    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatus("error");
      // Focus moves after the error summary renders.
      window.requestAnimationFrame(() => focusFirstError(errors));
      return;
    }

    setFieldErrors({});
    setStatus("submitting");

    let response: Response;

    try {
      response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setStatus("error");
      setFormError(FORM_ERRORS.NETWORK);
      window.requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }

    let payload: { ok?: boolean; code?: string; fieldErrors?: FieldErrors } = {};

    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      payload = {};
    }

    if (response.ok && payload.ok) {
      // Only clear user input after the server confirmed delivery.
      setValues(EMPTY);
      setFieldErrors({});
      setFormError(null);
      setStatus("success");
      window.requestAnimationFrame(() => successRef.current?.focus());
      return;
    }

    // Preserve everything the visitor typed on any failure path.
    if (payload.code === "VALIDATION_ERROR" && payload.fieldErrors) {
      setFieldErrors(payload.fieldErrors);
      setStatus("error");
      window.requestAnimationFrame(() => focusFirstError(payload.fieldErrors ?? {}));
      return;
    }

    const code = (payload.code ?? "") as keyof typeof FORM_ERRORS;
    setFormError(FORM_ERRORS[code] ?? FORM_ERRORS.SUBMISSION_FAILED);
    setStatus("error");
    window.requestAnimationFrame(() => summaryRef.current?.focus());
  }

  const errorCount = Object.keys(fieldErrors).length;

  /* ---------------------------------------------------------------------- */

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-success/35 bg-success/5 p-6 sm:p-8"
      >
        <h3 className="font-display text-xl font-semibold tracking-tight text-text">
          Thanks — your project details were sent successfully.
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          I&apos;ll review the information and reply using the email address you
          provided.
        </p>
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setStatus("idle")}
          >
            Send another inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      aria-describedby={formError ? `${formId}-error` : undefined}
    >
      <h3 className="sr-only">Project inquiry form</h3>

      {/* Error summary — announced, focusable, links to each bad field. */}
      {status === "error" && (errorCount > 0 || formError) ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-danger/45 bg-danger/5 p-4"
        >
          {formError ? (
            <p id={`${formId}-error`} className="text-sm text-text">
              {formError}
            </p>
          ) : null}

          {errorCount > 0 ? (
            <>
              <p className="text-sm font-medium text-text">
                Please fix {errorCount === 1 ? "1 field" : `${errorCount} fields`}:
              </p>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {(Object.keys(fieldErrors) as InquiryField[]).map((field) => (
                  <li key={field} className="text-sm text-muted">
                    <a
                      href={`#${formId}-${field}`}
                      className="underline decoration-danger/50 underline-offset-4 hover:text-text"
                      onClick={(event) => {
                        event.preventDefault();
                        fieldRefs.current[field]?.focus();
                      }}
                    >
                      {fieldErrors[field]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          formId={formId}
          field="name"
          label="Name"
          value={values.name}
          error={fieldErrors.name}
          autoComplete="name"
          maxLength={FIELD_LIMITS.name.max}
          required
          onChange={setField}
          onClearError={clearFieldError}
          registerRef={fieldRefs}
        />
        <TextField
          formId={formId}
          field="email"
          label="Work email"
          type="email"
          value={values.email}
          error={fieldErrors.email}
          autoComplete="email"
          maxLength={FIELD_LIMITS.email.max}
          required
          onChange={setField}
          onClearError={clearFieldError}
          registerRef={fieldRefs}
        />
      </div>

      <TextField
        formId={formId}
        field="company"
        label="Company"
        value={values.company}
        error={fieldErrors.company}
        autoComplete="organization"
        maxLength={FIELD_LIMITS.company.max}
        onChange={setField}
        onClearError={clearFieldError}
        registerRef={fieldRefs}
      />

      <SelectField
        formId={formId}
        field="service"
        label="Service needed"
        value={values.service}
        error={fieldErrors.service}
        options={SERVICE_OPTIONS}
        placeholder="Select a service"
        required
        onChange={setField}
        onClearError={clearFieldError}
        registerRef={fieldRefs}
      />

      <TextArea
        formId={formId}
        field="problem"
        label="Current problem"
        hint="What happens today, and where does it break down?"
        value={values.problem}
        error={fieldErrors.problem}
        rows={4}
        maxLength={FIELD_LIMITS.problem.max}
        required
        onChange={setField}
        onClearError={clearFieldError}
        registerRef={fieldRefs}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          formId={formId}
          field="budget"
          label="Budget range"
          value={values.budget}
          error={fieldErrors.budget}
          options={publicOptions(BUDGET_OPTIONS)}
          placeholder="Select a range"
          required
          onChange={setField}
          onClearError={clearFieldError}
          registerRef={fieldRefs}
        />
        <SelectField
          formId={formId}
          field="timeline"
          label="Desired timeline"
          value={values.timeline}
          error={fieldErrors.timeline}
          options={TIMELINE_OPTIONS}
          placeholder="Select a timeline"
          required
          onChange={setField}
          onClearError={clearFieldError}
          registerRef={fieldRefs}
        />
      </div>

      <TextArea
        formId={formId}
        field="details"
        label="Project details"
        hint="Tools involved, volume, and what success would look like."
        value={values.details}
        error={fieldErrors.details}
        rows={7}
        maxLength={FIELD_LIMITS.details.max}
        required
        onChange={setField}
        onClearError={clearFieldError}
        registerRef={fieldRefs}
      />

      {/*
        Honeypot. Visually hidden but valid markup: labelled, in the DOM, and
        removed from the tab order so a human never lands on it. Bots that fill
        every input get silently discarded.
      */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="nope"
          value={values.website}
          onChange={(event) => setField("website", event.target.value)}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted">
        By submitting this form, you agree that the information provided may be
        used to respond to your inquiry.
      </p>

      <div className="flex flex-col gap-3 pt-1">
        {/* Not disabled for incomplete fields — submitting is how the visitor
            discovers what is missing. Disabled only while a request is open. */}
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full sm:w-auto sm:self-start"
        >
          {pending ? "Sending…" : "Tell Me About Your Project"}
        </Button>

        <p aria-live="polite" className="text-xs text-muted">
          {pending ? "Submitting your inquiry." : ""}
        </p>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Field primitives                                                           */
/* -------------------------------------------------------------------------- */

type CommonProps = {
  formId: string;
  field: InquiryField;
  label: string;
  value: string;
  error: string | undefined;
  required?: boolean;
  hint?: string;
  onChange: (field: keyof Values, value: string) => void;
  onClearError: (field: keyof Values) => void;
  registerRef: React.MutableRefObject<
    Partial<Record<InquiryField, HTMLElement | null>>
  >;
};

function describedBy(formId: string, field: InquiryField, hint?: string) {
  const ids = [`${formId}-${field}-error`];
  if (hint) ids.unshift(`${formId}-${field}-hint`);
  return ids.join(" ");
}

function Label({
  formId,
  field,
  label,
  required,
  hint,
}: {
  formId: string;
  field: InquiryField;
  label: string;
  required?: boolean | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`${formId}-${field}`} className="text-sm font-medium text-text">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 text-accent">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
        )}
      </label>
      {hint ? (
        <p id={`${formId}-${field}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function ErrorText({
  formId,
  field,
  error,
}: {
  formId: string;
  field: InquiryField;
  error: string | undefined;
}) {
  if (!error) return null;
  return (
    <p id={`${formId}-${field}-error`} className="text-xs text-danger">
      {error}
    </p>
  );
}

function TextField({
  formId,
  field,
  label,
  value,
  error,
  required,
  hint,
  autoComplete,
  maxLength,
  type = "text",
  onChange,
  onClearError,
  registerRef,
}: CommonProps & {
  type?: string;
  autoComplete?: string;
  maxLength: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label formId={formId} field={field} label={label} required={required} hint={hint} />
      <input
        id={`${formId}-${field}`}
        name={field}
        type={type}
        value={value}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(formId, field, hint)}
        onChange={(event) => {
          onClearError(field);
          onChange(field, event.target.value);
        }}
        ref={(element) => {
          registerRef.current[field] = element;
        }}
        className={CONTROL}
      />
      <ErrorText formId={formId} field={field} error={error} />
    </div>
  );
}

function TextArea({
  formId,
  field,
  label,
  value,
  error,
  required,
  hint,
  rows,
  maxLength,
  onChange,
  onClearError,
  registerRef,
}: CommonProps & { rows: number; maxLength: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Label formId={formId} field={field} label={label} required={required} hint={hint} />
      <textarea
        id={`${formId}-${field}`}
        name={field}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(formId, field, hint)}
        onChange={(event) => {
          onClearError(field);
          onChange(field, event.target.value);
        }}
        ref={(element) => {
          registerRef.current[field] = element;
        }}
        className={`${CONTROL} resize-y`}
      />
      <ErrorText formId={formId} field={field} error={error} />
    </div>
  );
}

function SelectField({
  formId,
  field,
  label,
  value,
  error,
  required,
  options,
  placeholder,
  onChange,
  onClearError,
  registerRef,
}: CommonProps & {
  options: readonly { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label formId={formId} field={field} label={label} required={required} />
      <select
        id={`${formId}-${field}`}
        name={field}
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(formId, field)}
        onChange={(event) => {
          onClearError(field);
          onChange(field, event.target.value);
        }}
        ref={(element) => {
          registerRef.current[field] = element;
        }}
        className={CONTROL}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorText formId={formId} field={field} error={error} />
    </div>
  );
}
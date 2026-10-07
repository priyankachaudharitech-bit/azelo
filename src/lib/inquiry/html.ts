/**
 * HTML escaping and inquiry email rendering.
 *
 * Every value that originates from a visitor is treated as untrusted text and
 * escaped before it reaches the HTML email. User content is never rendered as
 * markup, and `dangerouslySetInnerHTML` is never used.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escapes the five characters that can break out of HTML text or attribute
 * context. Order matters: `&` must be replaced first.
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

/**
 * Removes control characters and collapses whitespace so untrusted text cannot
 * inject additional lines into a mail header (subject / Reply-To).
 */
export function headerSafe(input: string): string {
  return input.replace(/[\r\n\t]+/g, " ").replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

/** Preserves paragraph breaks in the plain-text alternative. */
function toPlainTextParagraphs(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

export type RenderedInquiryEmail = {
  subject: string;
  html: string;
  text: string;
};

export type InquiryEmailData = {
  name: string;
  email: string;
  company?: string | undefined;
  serviceLabel: string;
  budgetLabel: string;
  timelineLabel: string;
  problem: string;
  details: string;
  /** ISO-8601 submission time. */
  timestamp: string;
};

/** Renders a row label/value pair. */
function row(label: string, value: string): string {
  return `<tr>
        <td style="padding:10px 16px 10px 0;color:#9ca6b5;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`;
}

/** Renders a full-width block with pre-wrapped, escaped content. */
function block(label: string, value: string): string {
  return `<tr>
        <td style="padding:14px 0 6px;color:#9ca6b5;font-size:13px;">${escapeHtml(label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 14px;color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${escapeHtml(value)}</td>
      </tr>`;
}

/**
 * Builds the owner notification email.
 *
 * Deliberately plain: table-based, inline styles, no external assets, no
 * client-specific CSS — so it renders consistently across mail clients.
 */
export function renderInquiryEmail(data: InquiryEmailData): RenderedInquiryEmail {
  const company = data.company?.trim();
  const serviceName = headerSafe(data.serviceLabel);

  const subject = `New Project Inquiry — ${serviceName} — ${headerSafe(data.name)}`;

  const rows = [
    row("Name", data.name),
    row("Company", company && company.length > 0 ? company : "—"),
    row("Email", data.email),
    row("Service", data.serviceLabel),
    row("Budget range", data.budgetLabel),
    row("Timeline", data.timelineLabel),
    block("Current problem", toPlainTextParagraphs(data.problem)),
    block("Project details", toPlainTextParagraphs(data.details)),
    row("Received", data.timestamp),
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;">Project inquiry</p>
          <h1 style="margin:0;font-size:18px;color:#111827;">New project inquiry received</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
${rows}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    "New project inquiry received",
    "",
    `Name: ${data.name}`,
    `Company: ${company && company.length > 0 ? company : "—"}`,
    `Email: ${data.email}`,
    `Service: ${data.serviceLabel}`,
    `Budget range: ${data.budgetLabel}`,
    `Timeline: ${data.timelineLabel}`,
    "",
    "Current problem",
    "-------------",
    toPlainTextParagraphs(data.problem),
    "",
    "Project details",
    "---------------",
    toPlainTextParagraphs(data.details),
    "",
    `Received: ${data.timestamp}`,
  ].join("\n");

  return { subject, html, text };
}
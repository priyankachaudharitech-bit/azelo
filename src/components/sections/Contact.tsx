import { InquiryForm } from "@/components/forms/InquiryForm";
import { Section } from "@/components/ui/Section";
import { contact, site } from "@/lib/content";

/**
 * Contact section.
 *
 * Stays a Server Component. The only interactive part — the form — is the
 * `InquiryForm` client component, which owns all of its own state.
 */
export function Contact() {
  return (
    <Section id="contact" divided spacing="lg">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono">{contact.eyebrow}</p>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl">{contact.title}</h2>
          <p className="mt-6 max-w-[var(--container-prose)] text-base leading-relaxed text-muted">
            {contact.supporting}
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {contact.fieldNotes.map((note) => (
              <li key={note} className="flex items-start gap-3 text-sm text-muted">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent"
                />
                {note}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-hairline pt-6">
            <p className="text-sm text-muted">Prefer email?</p>
            <a
              href={`mailto:${site.email}`}
              className="mt-1 inline-flex items-center text-sm text-accent underline decoration-accent/40 underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:decoration-accent"
            >
              {site.email}
            </a>
          </div>
        </div>

        <InquiryForm />
      </div>
    </Section>
  );
}
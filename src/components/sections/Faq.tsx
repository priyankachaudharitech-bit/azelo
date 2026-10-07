import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faq } from "@/lib/content";

/**
 * Native <details>/<summary> disclosure — no client JavaScript required.
 * Keyboard support, semantics and the open/closed state come from the platform.
 */
export function Faq() {
  return (
    <Section id="faq" divided>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow={faq.eyebrow} title={faq.title} />
        </div>

        <div className="disclosure flex flex-col">
          {faq.items.map((item, index) => (
            <details
              key={item.id}
              name="faq"
              className="group border-t border-hairline last:border-b"
            >
              <summary className="flex min-h-14 items-center justify-between gap-4 py-5 font-display text-base font-semibold tracking-tight text-text transition-colors duration-[var(--duration-fast)] hover:text-accent sm:text-lg">
                <span className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-1 font-mono text-xs text-accent/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item.question}</span>
                </span>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className="h-4 w-4 flex-none text-muted transition-transform duration-[var(--duration-base)] group-open:rotate-45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                >
                  <path d="M8 3v10" />
                  <path d="M3 8h10" />
                </svg>
              </summary>

              <p className="max-w-[68ch] pb-6 pl-0 text-sm leading-relaxed text-muted sm:pl-8 sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
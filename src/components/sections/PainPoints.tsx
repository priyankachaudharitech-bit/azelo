import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { painPoints } from "@/lib/content";

/**
 * Editorial two-column list. Deliberately not a card grid — the content is
 * short enough to read as a structured list, and cards would add noise.
 */
export function PainPoints() {
  return (
    <Section id="problems" divided>
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow={painPoints.eyebrow}
            title={painPoints.title}
            description={painPoints.description}
          />
        </div>

        <ul className="flex flex-col">
          {painPoints.items.map((item, index) => (
            <li
              key={item.id}
              className="grid gap-2 border-t border-hairline py-6 first:border-t-0 first:pt-0 sm:grid-cols-[2.5rem_1fr] sm:gap-4 lg:py-7"
            >
              <span
                aria-hidden="true"
                className="font-mono text-xs tabular-nums text-accent/70"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex flex-col gap-2">
                <p className="font-display text-base font-semibold tracking-tight text-text sm:text-lg">
                  {item.problem}
                </p>
                <p className="max-w-[62ch] text-sm leading-relaxed text-muted">
                  {item.consequence}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
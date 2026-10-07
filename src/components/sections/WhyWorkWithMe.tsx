import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { whyWorkWithMe } from "@/lib/content";

/**
 * Full-width capability chain plus the practical reasons it matters. The caveat
 * is rendered deliberately: stating the limit is what makes the claim credible.
 */
export function WhyWorkWithMe() {
  return (
    <Section id="why" divided>
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <SectionHeading
            eyebrow={whyWorkWithMe.eyebrow}
            title={whyWorkWithMe.title}
            description={whyWorkWithMe.description}
          />

          <ul className="mt-10 flex flex-wrap items-center gap-2">
            {whyWorkWithMe.stages.map((stage, index) => (
              <li key={stage} className="flex items-center gap-2">
                <span className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-text">
                  {stage}
                </span>
                {index < whyWorkWithMe.stages.length - 1 ? (
                  <span aria-hidden="true" className="text-accent/50">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-[58ch] border-l-2 border-hairline-strong pl-4 text-sm leading-relaxed text-muted">
            {whyWorkWithMe.caveat}
          </p>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-hairline sm:grid-cols-2">
          {whyWorkWithMe.points.map((point) => (
            <li key={point.id} className="flex flex-col gap-2 bg-surface p-6 sm:p-7">
              <h3 className="font-display text-base font-semibold tracking-tight text-text">
                {point.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{point.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
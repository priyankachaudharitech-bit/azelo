import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { outcomes } from "@/lib/content";

/**
 * Outcome band. Uses a tinted surface and a three-column grid rather than cards
 * to give the page a change of rhythm, and states its limits explicitly so the
 * outcomes cannot be read as guarantees.
 */
export function Outcomes() {
  return (
    <Section id="outcomes" divided>
      <div className="rounded-[var(--radius-xl)] border border-hairline bg-surface px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
        <SectionHeading
          eyebrow={outcomes.eyebrow}
          title={outcomes.title}
          description={outcomes.description}
        />

        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
          {outcomes.items.map((outcome) => (
            <li key={outcome.id} className="flex flex-col gap-2.5">
              <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
              <h3 className="font-display text-lg font-semibold tracking-tight text-text">
                {outcome.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{outcome.statement}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
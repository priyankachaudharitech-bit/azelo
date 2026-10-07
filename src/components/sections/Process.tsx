import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { process } from "@/lib/content";

/**
 * Process timeline. On wide screens each stage sits on a shared horizontal rail
 * with a numbered node; below `lg` the same rail becomes a vertical spine so the
 * structure reads identically on mobile without duplicating markup.
 */
export function Process() {
  return (
    <Section id="process" divided>
      <SectionHeading
        eyebrow={process.eyebrow}
        title={process.title}
        description={process.description}
      />

      <ol className="process-rail mt-12 lg:mt-16">
        {process.stages.map((stage) => (
          <li key={stage.id} className="process-stage">
            <span aria-hidden="true" className="process-node">
              {stage.step}
            </span>

            <div className="process-body">
              <h3 className="font-display text-lg font-semibold tracking-tight text-text sm:text-xl">
                {stage.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted sm:text-base">
                {stage.description}
              </p>
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent"
                />
                <span>
                  <span className="text-text/80">Output: </span>
                  {stage.output}
                </span>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/lib/content";

/**
 * Editorial rows rather than a card grid: each service is a hairline-separated
 * row with a copy column and a structured detail column, so scanning stays easy
 * at any width.
 */
export function Services() {
  return (
    <Section id="services" divided>
      <SectionHeading
        eyebrow={services.eyebrow}
        title={services.title}
        description={services.description}
      />

      <div className="mt-12 grid gap-x-16 lg:mt-16">
        {services.items.map((service) => (
          <article
            key={service.id}
            className="grid gap-6 border-t border-hairline py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-12"
          >
            <div>
              <span aria-hidden="true" className="font-mono text-xs text-accent/70">
                {service.index}
              </span>
              <h3 className="mt-3 text-2xl sm:text-3xl">{service.title}</h3>
              <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted">
                {service.summary}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {service.tech.map((item) => (
                  <li key={item}>
                    <Badge mono>{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="grid gap-6 rounded-[var(--radius-lg)] border border-hairline bg-surface p-6 sm:p-7 lg:content-start">
              <Detail term="Problem" description={service.problem} />
              <Detail term="Approach" description={service.solution} />
              <Detail
                term="Business benefit"
                description={service.benefit}
                emphasis
              />
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Detail({
  term,
  description,
  emphasis,
}: {
  term: string;
  description: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-hairline pt-5 first:border-t-0 first:pt-0">
      <dt
        className={
          emphasis
            ? "font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-accent"
            : "font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted"
        }
      >
        {term}
      </dt>
      <dd
        className={
          emphasis
            ? "text-sm leading-relaxed text-text"
            : "text-sm leading-relaxed text-muted"
        }
      >
        {description}
      </dd>
    </div>
  );
}
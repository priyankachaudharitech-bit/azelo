import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects, type Project } from "@/lib/content";

/**
 * Reusable case-study block.
 *
 * Structurally identical for demo systems and real client work — swapping in a
 * verified case study means replacing the `Project` entry in `content.ts`, with
 * no layout change. The honesty label and disclaimer render from the same
 * fields, so a real project can carry a "Client Project" label and a factual
 * summary without touching this component.
 */
function ProjectCase({ project }: { project: Project }) {
  return (
    <Card accent className="flex flex-col gap-6 p-6 sm:p-7">
      <div className="flex flex-col gap-3">
        <Badge mono tone={project.kind === "Concept Project" ? "secondary" : "accent"}>
          {project.kind}
        </Badge>
        <h3 className="text-xl sm:text-2xl">{project.title}</h3>
        <p className="text-xs leading-relaxed text-muted/90">{project.disclaimer}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          Challenge
        </h4>
        <p className="text-sm leading-relaxed text-muted">{project.challenge}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          System
        </h4>
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {project.system.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="text-xs leading-relaxed text-text/90">{step}</span>
              {index < project.system.length - 1 ? (
                <span aria-hidden="true" className="text-accent/60">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                    <path
                      d="M0 4h10M7 1l3 3-3 3"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline pt-5">
        <h4 className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          Capabilities
        </h4>
        <ul className="flex flex-col gap-2">
          {project.capabilities.map((capability) => (
            <li key={capability} className="flex items-start gap-2.5 text-sm text-muted">
              <span
                aria-hidden="true"
                className="mt-1.5 h-1 w-1 flex-none rounded-full bg-accent/70"
              />
              {capability}
            </li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-wrap gap-2 border-t border-hairline pt-5">
        {project.tech.map((tech) => (
          <li key={tech}>
            <Badge mono>{tech}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function Work() {
  return (
    <Section id="work" divided>
      <SectionHeading
        eyebrow={projects.eyebrow}
        title={projects.title}
        description={projects.description}
      />

      <div className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-2">
        {projects.items.map((project) => (
          <ProjectCase key={project.id} project={project} />
        ))}
      </div>
    </Section>
  );
}
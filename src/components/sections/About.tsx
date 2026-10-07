import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { about } from "@/lib/content";

export function About() {
  return (
    <Section id="about" divided>
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow={about.eyebrow} title={about.title} />

          <ul className="mt-8 flex flex-col gap-2.5">
            {about.workingAcross.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted">
                <span aria-hidden="true" className="h-px w-5 flex-none bg-accent/50" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5 border-l border-hairline pl-6 sm:pl-8">
          {about.paragraphs.map((paragraph, index) => (
            <p
              key={paragraph.slice(0, 24)}
              className={
                index === 0
                  ? "text-lg leading-relaxed text-text sm:text-xl sm:leading-relaxed"
                  : "max-w-[62ch] text-base leading-relaxed text-muted"
              }
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
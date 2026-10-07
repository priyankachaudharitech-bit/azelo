import { HeroVisual } from "@/components/sections/HeroVisual";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { hero } from "@/lib/content";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-hairline"
    >
      {/* Texture layer — decorative, cheapest possible (two gradients). */}
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="bg-vignette pointer-events-none absolute inset-0" />

      <div className="relative mx-auto w-full max-w-[var(--container-page)] px-5 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-24 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:px-8 lg:pt-28 lg:pb-32">
        <div className="lg:max-w-[38rem]">
          <p className="label-mono">{hero.eyebrow}</p>

          <h1
            id="hero-heading"
            className="mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-[var(--container-prose)] text-base leading-relaxed text-muted sm:text-lg">
            {hero.supporting}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
            <ButtonLink href={hero.primaryCta.href} size="lg" className="w-full sm:w-auto">
              {hero.primaryCta.label}
            </ButtonLink>
            <ButtonLink
              href={hero.secondaryCta.href}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-hairline pt-6 sm:mt-10">
            <Badge mono tone="accent">
              Independent practice
            </Badge>
            <p className="max-w-[46ch] text-sm leading-relaxed text-muted">
              {hero.supportLine}
            </p>
          </div>
        </div>

        <div className="mt-12 lg:mt-0">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
import { heroFlow } from "@/lib/content";

/**
 * Workflow diagram for the hero.
 *
 * Deliberately a Server Component: the sequence is a CSS keyframe animation
 * with per-step delays, so no JavaScript ships for it. Every node carries its
 * own labels, so the diagram is fully comprehensible with animation disabled
 * or `prefers-reduced-motion: reduce` set.
 *
 * Layout is a single vertical flow on every breakpoint — it stays readable at
 * 375px without a separate mobile design, and it fills the hero's second
 * column without horizontal compression.
 */
export function HeroVisual() {
  return (
    <figure
      className="relative flex h-full flex-col rounded-[var(--radius-lg)] border border-hairline bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6 lg:p-7"
      aria-labelledby="hero-flow-caption"
    >
      <figcaption className="flex flex-col gap-1.5 border-b border-hairline pb-4">
        <span className="label-mono">Live system path</span>
        <span id="hero-flow-caption" className="text-sm leading-relaxed text-muted">
          {heroFlow.caption}
        </span>
      </figcaption>

      <ol className="flow-track relative mt-5 flex flex-1 flex-col">
        {/* Direction-of-travel indicator. Decorative, hidden from assistive tech. */}
        <span aria-hidden="true" className="flow-progress" />

        {heroFlow.nodes.map((node, index) => (
          <li key={node.id} className="flow-step relative pb-5 pl-9 last:pb-0">
            <span aria-hidden="true" className="flow-marker">
              <span className="flow-beacon" style={{ animationDelay: `${index * 1.6}s` }} />
            </span>

            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-[0.625rem] tabular-nums text-accent/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-sm font-semibold tracking-tight text-text sm:text-[0.9375rem]">
                  {node.label}
                </span>
              </span>
              <span className="flex items-center gap-2 text-xs leading-relaxed text-muted">
                <span className="status-dot" aria-hidden="true" />
                {node.detail}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-2.5 border-t border-hairline pt-4">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-muted">
          Events stream through each step
        </span>
      </div>
    </figure>
  );
}
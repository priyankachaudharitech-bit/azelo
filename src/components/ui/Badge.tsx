import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "secondary" | "success";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-hairline-strong bg-surface text-muted",
  accent: "border-accent/35 bg-accent/10 text-accent",
  secondary: "border-secondary/40 bg-secondary/10 text-[color-mix(in_oklab,var(--color-secondary)_70%,white)]",
  success: "border-success/35 bg-success/10 text-success",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  /** Renders in JetBrains Mono at small size — used for technical tags. */
  mono?: boolean;
  className?: string;
};

export function Badge({ children, tone = "neutral", mono, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none",
        mono && "font-mono text-[0.6875rem] tracking-[0.12em] uppercase",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
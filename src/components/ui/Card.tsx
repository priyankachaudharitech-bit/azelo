import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type CardProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Adds a hairline top accent line on hover-free surfaces. */
  accent?: boolean;
  interactive?: boolean;
};

/** Surface primitive: thin border, no glassmorphism, restrained elevation. */
export function Card({
  children,
  className,
  as: Tag = "div",
  accent,
  interactive,
}: CardProps) {
  return (
    <Tag
      className={cn(
        "relative rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-[var(--shadow-card)]",
        interactive &&
          "transition-[border-color,background-color,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] hover:-translate-y-0.5 hover:border-hairline-strong hover:bg-surface-elevated",
        className,
      )}
    >
      {accent ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent"
        />
      ) : null}
      {children}
    </Tag>
  );
}
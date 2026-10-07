import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  /** "default" = 1200px content column, "wide" = full-bleed with padding, "prose" = reading measure. */
  width?: "default" | "wide" | "prose";
  as?: ElementType;
};

const WIDTHS = {
  default: "mx-auto w-full max-w-[var(--container-page)] px-5 sm:px-6 lg:px-8",
  wide: "mx-auto w-full max-w-[var(--container-wide)] px-5 sm:px-6 lg:px-8",
  prose: "mx-auto w-full max-w-[var(--container-prose)] px-5 sm:px-6",
} as const;

/** Horizontal layout primitive: consistent gutters, one content measure. */
export function Container({
  children,
  className,
  width = "default",
  as: Tag = "div",
}: ContainerProps) {
  return <Tag className={cn(WIDTHS[width], className)}>{children}</Tag>;
}
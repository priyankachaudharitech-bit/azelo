import type { ReactNode } from "react";

import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/cn";

type SectionProps = {
  /** Stable anchor id — every section is linkable from the nav and sitemap. */
  id?: string;
  children: ReactNode;
  className?: string;
  /** Vertical rhythm. "sm" for tightly packed utility blocks, "lg" for hero-level. */
  spacing?: "sm" | "md" | "lg";
  /** Hairline top border to separate adjacent sections. */
  divided?: boolean;
  /** Adds the fine grid texture behind the content. */
  textured?: boolean;
  /** Renders at full-bleed width instead of the 1200px column. */
  width?: "default" | "wide";
  as?: "section" | "div";
};

const SPACING = {
  sm: "py-14 sm:py-16",
  md: "py-20 sm:py-24 lg:py-28",
  lg: "py-24 sm:py-32 lg:py-40",
} as const;

/** Vertical section primitive: rhythm, optional divider and texture in one place. */
export function Section({
  id,
  children,
  className,
  spacing = "md",
  divided,
  textured,
  width = "default",
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "relative scroll-mt-24",
        SPACING[spacing],
        divided && "hairline",
        textured && "bg-grid",
        className,
      )}
    >
      {textured ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-vignette opacity-70"
        />
      ) : null}
      <Container width={width} className="relative">
        {children}
      </Container>
    </Tag>
  );
}
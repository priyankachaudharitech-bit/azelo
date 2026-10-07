import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  /** Rendered as the section <h2>. The page <h1> lives in the hero only. */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  /** Heading level — keeps the document outline correct when nesting. */
  as?: "h2" | "h3";
  className?: string;
  /** Accessible id for aria-labelledby wiring. */
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  as: Heading = "h2",
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        <p className="label-mono flex items-center gap-2">
          <span aria-hidden="true" className="h-px w-6 bg-accent/60" />
          {eyebrow}
        </p>
      ) : null}

      <Heading id={id} className="text-3xl text-balance sm:text-4xl lg:text-5xl">
        {title}
      </Heading>

      {description ? (
        <p
          className={cn(
            "max-w-[var(--container-prose)] text-base leading-relaxed text-muted sm:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
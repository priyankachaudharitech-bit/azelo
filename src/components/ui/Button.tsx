import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/* Touch targets stay >= 44px tall on the two smallest breakpoints. */
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight " +
  "transition-[background-color,border-color,color,transform] duration-[var(--duration-base)] ease-[var(--ease-out-quart)] " +
  "select-none whitespace-nowrap active:translate-y-px " +
  "disabled:pointer-events-none disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-bg hover:bg-[color-mix(in_oklab,var(--color-accent)_88%,white)] shadow-[0_10px_30px_-18px_var(--color-accent)]",
  secondary:
    "border border-hairline-strong bg-surface text-text hover:border-accent/50 hover:bg-surface-elevated",
  ghost: "text-muted hover:text-text hover:bg-surface-elevated",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm sm:h-12 sm:px-6 sm:text-base",
  lg: "h-12 px-6 text-base sm:h-13 sm:px-7 sm:text-[0.975rem]",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

/** Native <button> — use for in-page actions that trigger behaviour. */
export function Button({
  variant,
  size,
  className,
  children,
  type = "button",
  ...rest
}: NativeButtonProps) {
  return (
    <button type={type} className={buttonStyles({ variant, size, className })} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  /** Set when the link points outside the app (opens in a new tab). */
  external?: boolean;
  title?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

/** Link rendered with button styling. External links get safe rel attributes. */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  external,
  title,
  ...aria
}: ButtonLinkProps) {
  const classNames = buttonStyles({ variant, size, className });
  const isHash = href.startsWith("#");

  if (!isHash) {
    return (
      <Link
        href={href}
        className={classNames}
        {...(external ? { target: "_blank" as const, rel: "noopener noreferrer" } : {})}
        {...(title ? { title } : {})}
        {...aria}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={classNames}
      {...(title ? { title } : {})}
      {...aria}
    >
      {children}
    </a>
  );
}
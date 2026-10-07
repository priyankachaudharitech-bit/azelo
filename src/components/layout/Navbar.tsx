"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { ButtonLink, buttonStyles } from "@/components/ui/Button";

type NavbarProps = {
  links: readonly { label: string; href: string }[];
  cta: { label: string; href: string };
};

export function Navbar({ links, cta }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[var(--container-page)] items-center justify-between gap-4 px-5 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <a
          href="#main"
          className="flex min-h-11 items-center"
          aria-label="AZELO home"
        >
          <BrandLogo variant="horizontal" size="xl" />
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3.5 text-sm text-muted transition-colors duration-[var(--duration-fast)] hover:bg-surface-elevated hover:text-text"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <ButtonLink href={cta.href} size="sm">
            {cta.label}
          </ButtonLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-[var(--duration-fast)] hover:bg-surface-elevated hover:text-text"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1={18} y1={6} x2={6} y2={18} />
              <line x1={6} y1={6} x2={18} y2={18} />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1={3} y1={12} x2={21} y2={12} />
              <line x1={3} y1={6} x2={21} y2={6} />
              <line x1={3} y1={18} x2={21} y2={18} />
            </svg>
          )}
        </button>
      </div>

      <div id="mobile-navigation" ref={panelRef} hidden={!open}>
        <div className="menu-in border-t border-hairline bg-bg md:hidden">
          <nav aria-label="Mobile" className="px-5 py-4 sm:px-6">
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={close}
                    className="flex min-h-12 items-center border-b border-hairline text-base text-text transition-colors duration-[var(--duration-fast)] hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-5 pb-2">
              <a
                href={cta.href}
                onClick={close}
                className={buttonStyles({ className: "w-full" })}
              >
                {cta.label}
              </a>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
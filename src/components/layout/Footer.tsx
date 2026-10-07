import { BrandLogo } from "@/components/layout/BrandLogo";
import { footer, site } from "@/lib/content";

/** Year is generated at render time — never hard-coded. */
function currentYear(): number {
  return new Date().getFullYear();
}

export function Footer() {
  const year = currentYear();

  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto w-full max-w-[var(--container-page)] px-5 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <BrandLogo variant="horizontal" size="md" />
            <p className="max-w-[42ch] text-sm leading-relaxed text-muted">
              {site.positioning}
            </p>

            {/* Contact is config-driven: rendered only when a real address is set. */}
            {site.email ? (
              <a
                href={`mailto:${site.email}`}
                className="inline-flex min-h-11 w-fit items-center text-sm text-accent underline decoration-accent/40 underline-offset-4 transition-colors duration-[var(--duration-fast)] hover:decoration-accent"
              >
                {site.email}
              </a>
            ) : null}
          </div>

          <nav aria-label="Footer" className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Navigate" links={navColumn()} />
            <FooterColumn title="Capabilities" links={capabilityColumn()} />
            <FooterColumn title="Start" links={startColumn()} />
          </nav>
        </div>

        {/* Social links render only when real profile URLs exist. */}
        {site.social.length > 0 ? (
          <ul className="mt-12 flex flex-wrap gap-5 border-t border-hairline pt-8">
            {site.social.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm text-muted transition-colors duration-[var(--duration-fast)] hover:text-text"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-12 flex flex-col gap-2 border-t border-hairline pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted">{site.role}</p>
        </div>
      </div>
    </footer>
  );
}

/* Column definitions live beside the footer so the markup stays declarative. */
function navColumn() {
  return footer.columns.find((column) => column.id === "navigate")?.links ?? [];
}

function capabilityColumn() {
  return footer.columns.find((column) => column.id === "capabilities")?.links ?? [];
}

function startColumn() {
  return footer.columns.find((column) => column.id === "start")?.links ?? [];
}

function FooterColumn({ title, links }: { title: string; links: readonly { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Group labels are plain text, not headings: they must not enter the
          document outline alongside the real section headings. */}
      <p className="label-mono">{title}</p>
      <ul className="flex flex-col gap-1">
        {links.map((link, index) => (
          <li key={`${link.href}-${index}`}>
            <a
              href={link.href}
              className="inline-flex min-h-9 items-center text-sm text-muted transition-colors duration-[var(--duration-fast)] hover:text-text"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
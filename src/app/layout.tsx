import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

const SITE_NAME = "AZELO";
const TITLE = `${SITE_NAME} — AI Automation & Full-Stack Systems`;
const DESCRIPTION =
  "AZELO builds practical AI-powered business systems, full-stack web experiences, n8n automations, AI voice solutions, lead-research workflows and data solutions that reduce manual work and turn opportunities into action.";

/**
 * Canonical origin. Configured via NEXT_PUBLIC_SITE_URL so production metadata,
 * sitemap and robots all share one source of truth.
 *
 * Validates the URL at build time: if it is localhost or absent, production
 * canonical/absolute SEO URLs are omitted rather than publishing a false one.
 */
function getSiteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return new URL("http://localhost:3000");
  }

  try {
    const url = new URL(raw);

    const isLocalhost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname.endsWith(".local") ||
      url.hostname.endsWith(".localhost");

    if (isLocalhost) {
      return new URL("http://localhost:3000");
    }

    return url;
  } catch {
    return new URL("http://localhost:3000");
  }
}

const SITE_URL = getSiteUrl();
const IS_PRODUCTION = SITE_URL.hostname !== "localhost";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [{ url: "/fav-icon.png", type: "image/png" }],
    apple: [{ url: "/fav-icon.png", type: "image/png" }],
  },
  keywords: [
    "AI automation",
    "n8n automation",
    "AI voice agent",
    "full-stack web development",
    "lead research",
    "data analysis",
    "business automation",
  ],
  ...(IS_PRODUCTION ? { alternates: { canonical: "/" } } : {}),
  openGraph: {
    type: "website",
    url: IS_PRODUCTION ? SITE_URL.toString() : undefined,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    ...(IS_PRODUCTION ? { images: ["/opengraph-image"] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    ...(IS_PRODUCTION ? { images: ["/opengraph-image"] } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: "#070a0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">
        {children}
        {IS_PRODUCTION && (
          <script
            type="application/ld+json"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "AZELO",
                description:
                  "AZELO builds practical AI-powered business systems, full-stack web experiences, n8n automations, AI voice solutions, lead-research workflows and data solutions that reduce manual work and turn opportunities into action.",
                url: SITE_URL.toString(),
                email: "priyankachaudhari.tech@gmail.com",
              }),
            }}
          />
        )}
      </body>
    </html>
  );
}
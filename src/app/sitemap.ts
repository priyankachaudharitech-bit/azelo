import type { MetadataRoute } from "next";

/**
 * sitemap.ts — Next.js metadata route.
 *
 * Only emits production URLs when NEXT_PUBLIC_SITE_URL is a legitimate,
 * non-localhost deployment URL. Localhost/dev URLs are omitted so the sitemap
 * never advertises a false production address.
 */
const PUBLIC_ROUTES = ["/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return [];
  }

  const isLocalhost =
    siteUrl.includes("localhost") ||
    siteUrl.includes("127.0.0.1") ||
    siteUrl.includes(".local") ||
    siteUrl.includes(".localhost");

  if (isLocalhost) {
    return [];
  }

  const origin = siteUrl.replace(/\/+$/, "");

  return PUBLIC_ROUTES.map((route) => ({
    url: `${origin}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 1,
  }));
}

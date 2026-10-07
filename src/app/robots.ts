import type { MetadataRoute } from "next";

/**
 * robots.ts — Next.js metadata route.
 *
 * If NEXT_PUBLIC_SITE_URL is not configured, returns a default that allows
 * crawling. The sitemap route handles the actual URL list and also guards
 * against localhost production URLs.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return {
      rules: [
        {
          userAgent: "*",
          allow: "/",
        },
      ],
    };
  }

  const isLocalhost =
    siteUrl.includes("localhost") ||
    siteUrl.includes("127.0.0.1") ||
    siteUrl.includes(".local") ||
    siteUrl.includes(".localhost");

  if (isLocalhost) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

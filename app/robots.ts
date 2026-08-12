import type { MetadataRoute } from "next"
import { PRIVATE_PATH_PREFIXES, SITE_ORIGIN } from "@/lib/seo"

/**
 * Served at /robots.txt.
 *
 * Note what is NOT here: the admin console path. robots.txt is world-readable,
 * so disallowing an obscured path would publish it to anyone who asks. It is
 * excluded by the `X-Robots-Tag: noindex` header in proxy.ts instead — see
 * lib/seo.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATH_PREFIXES,
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  }
}

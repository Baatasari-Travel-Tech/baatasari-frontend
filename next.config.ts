import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy barrel imports so only the used exports ship. These are
    // the largest contributors to the public JS bundle (icons + animation +
    // charts + date utils + carousel).
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "recharts",
      "date-fns",
      "embla-carousel-react",
    ],
  },
  images: {
    // No host-side optimizer.
    //
    // This used to rely on Vercel's, which is not available on every runtime —
    // it needs sharp, a native binary. Rather than trade one host lock-in for a
    // paid transformation service, the bytes are made right at their source:
    // everything in public/ is pre-encoded to WebP by scripts/build-assets.mjs,
    // and event covers already arrive as 1000x1500 WebP because the backend
    // resizes them on upload (organizer.service.ts).
    //
    // What is genuinely lost is per-device widths — a phone gets the same file
    // as a laptop. The fix for that is a second, smaller variant written at
    // upload time, which belongs in the backend next to the resize that is
    // already there, not in a host-specific optimizer.
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google account profile pictures (seeded as avatar on OAuth signup).
      // Google rotates between lh3, lh4, lh5, lh6, ... subdomains so we
      // wildcard the whole eTLD+1.
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      {
        // The page used to live at /terms&conditions. A literal "&" in a path
        // cannot appear in a sitemap without entity-escaping, which Next's
        // sitemap serializer does not do — the raw character made the whole
        // sitemap invalid XML, and Google discards an invalid sitemap outright
        // rather than skipping the one bad entry. Permanent so the old URL
        // (linked from older pages, and possibly registered with the payment
        // gateway) keeps resolving and passes its ranking on.
        source: "/terms&conditions",
        destination: "/terms-and-conditions",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Two years, and covering subdomains — the platform default omitted
          // includeSubDomains, which left api. and campus-connect. open to a
          // first-visit downgrade. Verified beforehand that every subdomain
          // already redirects HTTP to HTTPS, so nothing is cut off.
          //
          // The `preload` token is deliberately absent: it only does anything
          // once the domain is submitted at hstspreload.org, and getting back
          // off that list takes months. That is a decision to make on purpose,
          // not a side effect of a header tweak.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Cuts this origin off from any window that opened it. Google sign-in
          // is a full-page redirect here, not a popup, so `same-origin` would
          // also be safe — allow-popups is chosen so that adding a popup-based
          // flow later fails visibly rather than silently breaking sign-in.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

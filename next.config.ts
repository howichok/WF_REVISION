import type { NextConfig } from "next";

/** HSTS only where TLS is guaranteed on the platform (Vercel / Netlify) or when explicitly enabled. */
const hstsHeaders =
  process.env.VERCEL === "1" ||
  process.env.NETLIFY === "true" ||
  process.env.ENABLE_HSTS === "1"
    ? ([
        { key: "Strict-Transport-Security", value: "max-age=63072000; preload" },
      ] as const)
    : [];

const baselineSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

/** Same effect as Netlify `public/_headers` X-Robots-Tag; toggled per deploy via env. */
const noindexHeaders =
  process.env.BLOCK_SEARCH_INDEXING === "1"
    ? ([{ key: "X-Robots-Tag", value: "noindex, nofollow" }] as const)
    : [];

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...hstsHeaders, ...baselineSecurityHeaders, ...noindexHeaders],
      },
    ];
  },
};

export default nextConfig;

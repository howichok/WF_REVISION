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

/**
 * Content Security Policy.
 *
 * Key decisions:
 * - `script-src 'unsafe-inline'`  — required by the anti-FOUC inline script in layout.tsx.
 *   Migrate to a per-request nonce to tighten this when ready.
 * - `style-src 'unsafe-inline'`   — Tailwind + Framer Motion inject inline styles at runtime.
 * - `connect-src *.supabase.co`   — Supabase REST/Realtime from the browser client.
 * - `img-src data: blob:`         — html-to-image canvas exports.
 * - `object-src 'none'`           — blocks all plugin embeds (Flash etc.).
 * - `frame-ancestors 'none'`      — prevents clickjacking.
 * - `base-uri 'self'`             — blocks base-tag injection.
 * - `form-action 'self'`          — prevents cross-origin form hijacking.
 */
const buildCsp = () => {
  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net",
    "media-src 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
};

const baselineSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: buildCsp() },
];

/** Same effect as Netlify `public/_headers` X-Robots-Tag; toggled per deploy via env. */
const noindexHeaders =
  process.env.BLOCK_SEARCH_INDEXING === "1"
    ? ([{ key: "X-Robots-Tag", value: "noindex, nofollow" }] as const)
    : [];

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    // lucide: safe to optimize. Do NOT list framer-motion here — Next can split the
    // package across chunks so MotionConfig / layout context no longer matches motion
    // components, which makes animations appear "dead" in the browser.
    optimizePackageImports: ["lucide-react"],
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

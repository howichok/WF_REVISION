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

  // DO NOT add exceljs / docx / mammoth to serverExternalPackages.
  // That config makes Next.js create .next/node_modules/ junctions pointing at the
  // full raw package dirs (20.8 + 5.8 + 2.2 MB). Netlify follows those symlinks
  // and copies every byte into the Lambda zip, pushing it over the 50 MB limit.
  // Instead let webpack bundle + minify them (≈ 11 MB combined → Lambda stays ~46 MB).

  // Keep archived duplicate apps and local curriculum blobs out of the serverless
  // trace. ESP board PDFs/ZIPs are served from `public/esp-official-task/` instead
  // of `readFile()` so they never land in the Netlify handler bundle.
  outputFileTracingExcludes: {
    "*": [
      "./Combine trhemlol/**",
      "**/Combine trhemlol/**",
      "./sources/**",
    ],
  },

  experimental: {
    // Both safe to barrel-optimize; framer-motion is back because we've hardcoded
    // reduceMotion=false in all components, so the MotionConfig context issue is gone,
    // and proper tree-shaking keeps the client bundle lean.
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

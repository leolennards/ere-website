import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// 'unsafe-inline' scripts are required by Next.js streaming without per-request
// nonces; see docs/SECURITY_AND_PRIVACY.md for the trade-off.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  "frame-src https://www.google.com",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "sharp", "pg", "@electric-sql/pglite"],
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
  // Preserve the old WordPress URLs.
  async redirects() {
    return [
      // One canonical host: the bare domain forwards to www.
      { source: "/:path*", has: [{ type: "host", value: "elevaterealestate.co.za" }], destination: "https://www.elevaterealestate.co.za/:path*", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/listings", destination: "/buy", permanent: true },
      { source: "/listings/:path*", destination: "/buy", permanent: true },
      { source: "/our-agents", destination: "/about", permanent: true },
      { source: "/half-map-search", destination: "/buy", permanent: true },
      { source: "/location", destination: "/buy", permanent: true },
      { source: "/our-articles", destination: "/", permanent: true },
      { source: "/wp-admin/:path*", destination: "/admin", permanent: false },
      { source: "/wp-login.php", destination: "/admin/login", permanent: false },
    ];
  },
};

export default nextConfig;

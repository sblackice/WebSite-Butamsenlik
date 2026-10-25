import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Admin image uploads go through server actions (max 5 MB file + form fields).
    serverActions: {
      bodySizeLimit: "6mb",
      // GitHub Codespaces serves the app through *.app.github.dev; allow that origin only there.
      ...(process.env.CODESPACES === "true" ? { allowedOrigins: ["*.app.github.dev", "localhost:3000"] } : {}),
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;

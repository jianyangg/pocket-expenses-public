import type { NextConfig } from "next";
const config: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.plaid.com" +
                (process.env.NODE_ENV === "development"
                  ? " 'unsafe-eval'"
                  : ""),
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.plaid.com",
              "connect-src 'self' https://*.plaid.com",
              "frame-src https://*.plaid.com",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};
export default config;

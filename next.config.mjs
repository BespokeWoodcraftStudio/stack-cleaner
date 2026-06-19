/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The tool is 100% client-side; keep the build resilient on Vercel.
  eslint: { ignoreDuringBuilds: true },

  // Security headers applied to every route. No backend, no cookies, no
  // third-party scripts — so these can be strict.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

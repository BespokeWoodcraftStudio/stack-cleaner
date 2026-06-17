/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The tool is 100% client-side; keep the build resilient on Vercel.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

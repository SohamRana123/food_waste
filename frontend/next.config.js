/* Next.js proxies /api/backend/* to the FastAPI server (set at build time for Docker). */
const backendRewriteTarget =
  process.env.BACKEND_URL_FOR_REWRITE || "http://127.0.0.1:8000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendRewriteTarget.replace(/\/$/, "")}/:path*`
      }
    ];
  }
};

module.exports = nextConfig;

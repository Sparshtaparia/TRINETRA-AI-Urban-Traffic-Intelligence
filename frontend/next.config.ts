import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy requests to the Railway backend in production to avoid ISP DNS blocking & cold start CORS errors
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://trinetra-ai-urban-traffic-intelligence-production.up.railway.app";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

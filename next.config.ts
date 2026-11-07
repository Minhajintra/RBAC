import type { NextConfig } from "next";

const backendBaseUrl =
  process.env.BACKEND_BASE_URL ||
  "https://custody-studio-syndrome-passes.trycloudflare.com";



const nextConfig: NextConfig = {
  reactStrictMode: true,
   devIndicators: false,
  async redirects() {
    return [
      {
        source: "/system-settings",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/security-settings",
        destination: "/settings",
        permanent: true,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: backendBaseUrl,
    BACKEND_BASE_URL: backendBaseUrl,
    
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable persistent filesystem cache during development to prevent
      // Windows fs.rename ENOENT conflicts on temporary pack files (.pack.gz_)
      config.cache = false;
      
    }
    return config;
  },
};

export default nextConfig;

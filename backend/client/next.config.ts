import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.mahbuburrahman.xyz/api",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://admin.mahbuburrahman.xyz",
  },
};

export default nextConfig;

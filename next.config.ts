import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-quill-new"],
  images: {
    // 1. Prioritize AVIF (up to 50% smaller than WebP)
    formats: ["image/avif", "image/webp"],
    // 2. Add smaller mobile breakpoints (360, 480)
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gpjgvdpicjqrerqqzhyx.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // New: Allow UploadThing images
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;

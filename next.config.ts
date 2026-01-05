import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpiling ensures the editor styles/logic are properly handled by Next.js
  transpilePackages: ["react-quill-new"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gpjgvdpicjqrerqqzhyx.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

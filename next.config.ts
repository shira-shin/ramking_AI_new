import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typescript: {
    // TODO: remove after pipeline stabilizes
    ignoreBuildErrors: true,
  },
};
export default nextConfig;

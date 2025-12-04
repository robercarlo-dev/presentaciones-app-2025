import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Cambia '5mb' por el tamaño que necesites
    },
  },
};

export default nextConfig;

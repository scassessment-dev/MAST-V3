import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: { outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)) },
  transpilePackages: ["@mast/core", "@mast/database"]
};

export default nextConfig;

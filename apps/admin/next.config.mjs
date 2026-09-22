/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@mast/core", "@mast/database"],
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"]
  }
};

export default nextConfig;

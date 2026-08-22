/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E: permite un directorio de build aislado para no pisar el .next del dev server
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    domains: ["cronosmdbucket.s3.us-east-2.amazonaws.com"],
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;

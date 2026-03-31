/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Smaller Docker images; copy `.next/static` + `public` in Dockerfile */
  output: "standalone",
};

export default nextConfig;

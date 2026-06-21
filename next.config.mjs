/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress warnings related to specific environment configurations
  serverExternalPackages: ['pg'],
};

export default nextConfig;

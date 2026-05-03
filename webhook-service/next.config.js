/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@remotion/lambda'],
  },
};

module.exports = nextConfig;

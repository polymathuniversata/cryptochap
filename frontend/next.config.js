/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  experimental: {
    // Add any experimental features here if needed
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '25mb' }
  },
  serverExternalPackages: ['better-sqlite3', 'puppeteer', 'playwright']
};

module.exports = nextConfig;

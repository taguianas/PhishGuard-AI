/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;

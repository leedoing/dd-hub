/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  useFileSystemPublicRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
}

module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  useFileSystemPublicRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    appDir: true
  }
}

module.exports = nextConfig 
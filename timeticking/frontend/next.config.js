/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;

// Proxy API requests to backend during development
if (process.env.NODE_ENV !== 'production') {
  module.exports = {
    ...module.exports,
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4000/api/:path*',
        },
      ];
    },
  };
}

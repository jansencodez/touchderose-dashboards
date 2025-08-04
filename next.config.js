/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "uxxfjnmbvtsbjctnjysr.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  images: {
    domains: ["images.pexels.com", "uxxfjnmbvtsbjctnjysr.supabase.co"],
  },
};

module.exports = nextConfig;

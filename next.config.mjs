/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Turbopack uses this repository folder as the root
  turbopack: {
    root: './',
  },
};

export default nextConfig;

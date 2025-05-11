/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
    scrollRestoration: true,
  },
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
};

export default nextConfig;

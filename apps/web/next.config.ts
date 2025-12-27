import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/image/loader.ts',
  },
};

export default nextConfig;

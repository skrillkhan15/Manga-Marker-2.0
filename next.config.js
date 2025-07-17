/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static site generation
  basePath: '/manga-marks', // GitHub Pages homepage subpath
  images: {
    unoptimized: true, // Required for static export of images
  },
  reactStrictMode: true, // Recommended for React best practices
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: process.env.NEXT_PUBLIC_STATIC_EXPORT || 'false',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide fallbacks for Node.js modules that don't work in browsers
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        http2: false,
        'node:net': false,
        'node:dns': false,
      };

      if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
        // Ignore native .node files during static export
        config.module.rules.push({
          test: /\.node$/,
          use: 'null-loader',
        });

        // Remove CopyPlugin if present (optional, depends on your plugins)
        config.plugins = config.plugins.filter(
          (plugin) => plugin.constructor.name !== 'CopyPlugin'
        );
      }
    }
    return config;
  },
};

module.exports = nextConfig;

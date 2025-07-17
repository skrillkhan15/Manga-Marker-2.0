/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static export
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: process.env.NEXT_PUBLIC_STATIC_EXPORT || 'false',
  },
  webpack: (config, { isServer }) => {
    const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

    if (!isServer) {
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

      if (isStaticExport) {
        config.module.rules.push({
          test: /\.node$/,
          use: 'null-loader',
        });

        config.plugins = config.plugins.filter(
          (plugin) => plugin.constructor.name !== 'CopyPlugin'
        );
      }
    }

    return config;
  },
};

module.exports = nextConfig;

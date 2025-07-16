/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: process.env.NEXT_PUBLIC_STATIC_EXPORT || 'false',
  },
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
 config.resolve.fallback = {
        ...config.resolve.fallback,
        'node:net': false,
        'node:dns': false,
 net: false,
 tls: false,
      };
      config.module.rules.push({
        test: /\.node:/,
        use: 'null-loader', // Use a loader that ignores the module
      });
      config.plugins = config.plugins.filter((p) => {
        return p.constructor.name !== 'CopyPlugin';
      });
    }
 if (!isServer) {
 config.resolve.fallback = {
 ...config.resolve.fallback,
        net: false,
        tls: false,
        dns: false,
 fs: false,
 http2: false,
      };
    }
    return config;
  }
}

module.exports = nextConfig;

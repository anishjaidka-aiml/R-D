/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // For LangChain compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      http2: false, // http2 is Node.js-only
    };

    // Mark googleapis as external to prevent client-side bundling
    // (it uses Node.js-only modules like http2)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'googleapis': false,
        'googleapis-common': false,
      };
    }

    return config;
  },
}

module.exports = nextConfig


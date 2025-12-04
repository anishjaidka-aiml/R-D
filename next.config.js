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

    // Mark googleapis and chromadb as external to prevent client-side bundling
    // (they use Node.js-only modules)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'googleapis': false,
        'googleapis-common': false,
        'chromadb': false,
        '@chroma-core/default-embed': false,
        'pdf-parse': false,
      };
    }

    // Mark problematic packages as external for server-side too (prevents bundling issues)
    config.externals = config.externals || [];
    if (typeof config.externals === 'function') {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : []),
        'chromadb',
        '@chroma-core/default-embed',
        'pdf-parse',
      ];
    } else if (Array.isArray(config.externals)) {
      config.externals.push('chromadb', '@chroma-core/default-embed', 'pdf-parse');
    }
    
    // Ignore pdf-parse's problematic file access during build
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['pdf-parse/lib/pdf.js'] = false;

    return config;
  },
}

module.exports = nextConfig


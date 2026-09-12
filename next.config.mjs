import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      'zod/v3': 'zod',
      'zod/v4-mini': 'zod-v4-mini',
      'zod/v4': 'zod-v4-mini',
    },
  },
  // Exclude packages that bundle their own zod v4 from webpack bundling
  serverExternalPackages: [
    '@modelcontextprotocol/sdk',
    '@iqai/adk',
    '@copilotkit/runtime',
    '@langchain/core',
    '@ag-ui/langgraph',
  ],
  webpack: (config, { isServer, webpack }) => {
    // NormalModuleReplacementPlugin intercepts zod sub-path imports
    // at module resolution time — works even when nested packages bundle
    // their own zod copy that lacks the ./v3 export.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^zod\/v3$/, require.resolve('zod')),
      new webpack.NormalModuleReplacementPlugin(/^zod\/v4$/, require.resolve('zod-v4-mini')),
      new webpack.NormalModuleReplacementPlugin(/^zod\/v4-mini$/, require.resolve('zod-v4-mini')),
    );

    // Also keep resolve.alias as a belt-and-suspenders fallback
    config.resolve.alias = {
      ...config.resolve.alias,
      'zod/v3': require.resolve('zod'),
      'zod/v4-mini': require.resolve('zod-v4-mini'),
      'zod/v4': require.resolve('zod-v4-mini'),
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'zod/v3': false,
        'zod/v4-mini': false,
        'zod/v4': false,
      };
    }
    return config;
  },
};

export default nextConfig;
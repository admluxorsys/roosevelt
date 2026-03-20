
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      // From next.config.mjs
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        port: '',
        pathname: '/random/**',
      },
      // From next.config.ts
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Legacy Redirects
      { source: '/cso', destination: '/suite', permanent: true },
      { source: '/cso/whatsapp', destination: '/suite/coo/whatsapp', permanent: true },
      { source: '/cso/contacts', destination: '/suite/cmo/crm', permanent: true },
      { source: '/cso/campaigns', destination: '/suite/cmo/campaigns', permanent: true },
      { source: '/cso/automation', destination: '/suite/cto/automation', permanent: true },
      { source: '/cso/voice-center', destination: '/suite/cto/voice-center', permanent: true },
      { source: '/cso/web-builder', destination: '/suite/cto/web-builder', permanent: true },
      { source: '/cso/meet-agents', destination: '/suite/cto/meet-agents', permanent: true },
      { source: '/cso/orchestrator', destination: '/suite/cto/orchestrator', permanent: true },
      { source: '/cso/conexion', destination: '/suite/cto/integrations', permanent: true },
    ];
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

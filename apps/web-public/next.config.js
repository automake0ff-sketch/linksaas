/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@linkforge/contracts'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.linkforge-uploads.r2.dev' }],
  },
  async headers() {
    return [
      {
        // Página pública cacheada agresivamente en el edge (Cloudflare la
        // respeta detrás); revalidada por invalidación explícita al
        // publicar, no por expiración corta — ver docs/10-DevOps.md.
        source: '/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

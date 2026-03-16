/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy /api/* requests to the backend (server-to-server bypasses CORS).
    // On production set NEXT_PUBLIC_API_URL="" so client builds relative URLs.
    // On localhost keep NEXT_PUBLIC_API_URL="http://localhost:5000" for direct access.
    const backendUrl =
      process.env.BACKEND_API_URL || "https://backend.gulfestates.ae";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://cloudinary.com https://images.unsplash.com https://unsplash.com https://gulfestates.ae https://www.gulfestates.ae",
              "media-src 'self' blob: data: https://gulfestates.ae https://www.gulfestates.ae https://res.cloudinary.com https://cloudinary.com",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:5000 https://backend.gulfestates.ae https://backend.gulf.smbdigitalzone.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
};

export default nextConfig;


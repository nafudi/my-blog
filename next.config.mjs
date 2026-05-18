/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // disabled: causes build conflicts
  outputFileTracingIncludes: {
    '/api/posts': ['./content/**/*'],
  },
  async headers() {
    return [
      {
        source: "/posts/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 允许嵌入 content 目录下的 HTML 文章页面
  async headers() {
    return [
      {
        source: "/posts/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

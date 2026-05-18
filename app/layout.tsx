import type { Metadata } from "next";
import { Ma_Shan_Zheng, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
import PostSidebar from "@/components/PostSidebar";
import StarBg from "@/components/StarBg";
import Heartbeat from "@/components/Heartbeat";

const maShanZheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-ma-shan",
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-noto-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "易理 · 个人学习博客",
  description: "分享兴趣爱好与生活，用可视化交互内容诠释传统文化与现代美学",
  keywords: ["易理", "博客", "学习", "传统文化", "可视化"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${maShanZheng.variable} ${notoSerif.variable} font-[family-name:var(--font-noto-serif)] min-h-screen antialiased`}
      >
        <SessionProvider>
          <Heartbeat />
          {/* ===== 全局外壳：背景 + 侧边栏 + 导航栏 + 页脚 ===== */}
          <div className="relative min-h-screen">
            <StarBg />
            <PostSidebar />
            <div className="lg:ml-64 min-w-0 overflow-x-hidden">
              <Navbar />
              <main className="relative z-10 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto min-w-0 overflow-x-hidden">
                {children}
              </main>
              <footer
                className="relative z-10 mt-8 pt-6 border-t text-center pb-8"
                style={{ borderColor: "rgba(212,168,83,0.08)" }}
              >
                <p className="text-xs" style={{ color: "#aaaaaa" }}>
                  Powered by Next.js & Crafted with ✨
                </p>
              </footer>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}

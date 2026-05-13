import type { Metadata } from "next";
import { Ma_Shan_Zheng, Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

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
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

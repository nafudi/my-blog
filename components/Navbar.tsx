"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { colors, fonts, fontSizes } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-transparent border-b"
      style={{ borderColor: "rgba(212,168,83,0.1)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span
              className={`${fonts.heading} text-2xl transition-colors duration-300`}
              style={{ color: colors.goldPrimary }}
            >
              易理
            </span>
            <span
              className="hidden sm:block text-xs border-l pl-3"
              style={{
                color: colors.textSecondary,
                borderColor: "rgba(212,168,83,0.2)",
              }}
            >
              个人学习博客
            </span>
          </Link>

          {/* 导航链接 + 用户区域 */}
          <div className="flex items-center gap-4">
            {/* 首页链接 */}
            <Link
              href="/"
              className={`${fontSizes.bodySm} transition-colors duration-300 hover:text-[${colors.goldPrimary}]`}
              style={{
                color: pathname === "/" ? colors.goldPrimary : colors.textSecondary,
              }}
            >
              首页
            </Link>

            {/* 登录状态 */}
            {status === "loading" ? (
              <span className={fontSizes.caption} style={{ color: colors.textTertiary }}>...</span>
            ) : session?.user ? (
              <div className="relative flex items-center gap-2">
                {/* 头像 + 名字 */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors"
                  style={{
                    background: "rgba(212,168,83,0.12)",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${colors.goldPrimary}, ${colors.goldDark})`,
                      color: "#fff",
                    }}
                  >
                    {(session.user.name || session.user.email || "?")[0].toUpperCase()}
                  </div>
                  <span
                    className={`hidden sm:block ${fontSizes.bodySm} max-w-[100px] truncate`}
                    style={{ color: colors.textPrimary }}
                  >
                    {session.user.name || session.user.email}
                  </span>
                </button>

                {/* 下拉菜单 */}
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-40 rounded-xl p-2 shadow-xl"
                      style={{
                        background: colors.bgSecondary,
                        border: "1px solid rgba(212,168,83,0.12)",
                      }}
                    >
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                          setShowMenu(false);
                        }}
                        className={`w-full text-left ${fontSizes.bodySm} px-3 py-2 rounded-lg transition-colors`}
                        style={{
                          color: colors.textSecondary,
                        }}
                      >
                        退出登录
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${fontSizes.bodySm} transition-colors`}
                  style={{ color: colors.textSecondary }}
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className={`${fontSizes.bodySm} px-3 py-1 rounded-full transition-opacity hover:opacity-90`}
                  style={{
                    background: `linear-gradient(90deg, ${colors.goldPrimary}, ${colors.goldDark})`,
                    color: colors.bgPrimary,
                  }}
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

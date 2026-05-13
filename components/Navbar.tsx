"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

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
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-transparent border-b border-[rgba(212,168,83,0.1)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-[family-name:var(--font-ma-shan)] text-2xl text-[#d4a853] group-hover:text-[#f0d78c] transition-colors duration-300">
              易理
            </span>
            <span className="hidden sm:block text-xs text-[#9a9590] border-l border-[rgba(212,168,83,0.2)] pl-3">
              个人学习博客
            </span>
          </Link>

          {/* 导航链接 + 用户区域 */}
          <div className="flex items-center gap-4">
            {/* 首页链接 */}
            <Link
              href="/"
              className={`text-sm transition-colors duration-300 hover:text-[#d4a853] ${
                pathname === "/" ? "text-[#d4a853]" : "text-[#9a9590]"
              }`}
            >
              首页
            </Link>

            {/* 登录状态 */}
            {status === "loading" ? (
              <span className="text-xs text-[#555]">...</span>
            ) : session?.user ? (
              <div className="relative flex items-center gap-2">
                {/* 头像 + 名字 */}
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(212,168,83,0.12)] hover:bg-[rgba(212,168,83,0.18)] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#d4a853] to-[#a67c3d] flex items-center justify-center text-xs text-white font-semibold">
                    {(session.user.name || session.user.email || "?")[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm text-[#e8e6e3] max-w-[100px] truncate">
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
                      className="absolute top-full right-0 mt-2 w-40 bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-2 shadow-xl"
                    >
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/" });
                          setShowMenu(false);
                        }}
                        className="w-full text-left text-sm text-[#9a9590] hover:text-[#e8e6e3] px-3 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
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
                  className="text-sm text-[#9a9590] hover:text-[#d4a853] transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:opacity-90 transition-opacity"
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

import { useState } from "react";

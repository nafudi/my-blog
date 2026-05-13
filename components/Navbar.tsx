"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { colors, fonts, fontSizes } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    {
      label: "溯源",
      href: "/#溯源",
      activePattern: "na-yin-wu-xing-quan-shuo|tian-gan-wu-he",
      subItems: [
        { label: "纳音五行全说", href: "/posts/na-yin-wu-xing-quan-shuo" },
        { label: "天干五合数理推演", href: "/posts/tian-gan-wu-he" },
      ],
    },
    {
      label: "杂谈",
      href: "/#杂谈",
      activePattern: "tong-zi-ming",
      subItems: [
        { label: "验证玄学天赋", href: "/posts/tong-zi-ming" },
      ],
    },
  ];

  const isNavActive = (item: typeof navItems[0]) => {
    if (pathname === "/") return false;
    const pattern = new RegExp(item.activePattern);
    return pattern.test(pathname);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: "rgba(10,10,15,0.85)",
        borderColor: "rgba(212,168,83,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
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

          {/* Nav links + user */}
          <div className="flex items-center gap-1 sm:gap-4">
            <Link
              href="/"
              className={`${fontSizes.bodySm} px-2 py-1 rounded-lg transition-all duration-300`}
              style={{
                color: pathname === "/" ? colors.goldPrimary : colors.textSecondary,
                background: pathname === "/" ? "rgba(212,168,83,0.1)" : "transparent",
              }}
            >
              首页
            </Link>

            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className={`${fontSizes.bodySm} px-2 py-1 rounded-lg transition-all duration-300 flex items-center gap-1`}
                  style={{
                    color: isNavActive(item) ? colors.goldPrimary : colors.textSecondary,
                    background: isNavActive(item) ? "rgba(212,168,83,0.1)" : "transparent",
                  }}
                >
                  {item.label}
                  <svg className="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L2 4h8z"/>
                  </svg>
                </Link>
                <div
                  className="absolute top-full left-0 mt-1 w-48 rounded-xl p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                  style={{
                    background: colors.bgSecondary,
                    border: "1px solid rgba(212,168,83,0.12)",
                  }}
                >
                  {item.subItems.map((sub) => (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`block ${fontSizes.bodySm} px-3 py-2 rounded-lg transition-colors hover:bg-[rgba(212,168,83,0.1)]`}
                      style={{ color: colors.textSecondary }}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {status === "loading" ? (
              <span className={fontSizes.caption} style={{ color: colors.textTertiary }}>...</span>
            ) : session?.user ? (
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors"
                  style={{ background: "rgba(212,168,83,0.12)" }}
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
                        style={{ color: colors.textSecondary }}
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
    </nav>
  );
}

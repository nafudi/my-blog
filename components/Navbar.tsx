"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { colors, fonts, fontSizes } from "@/lib/theme";

/* ========== 积分弹窗组件 ========== */
function CreditsModal({
  balance,
  onClose,
}: {
  balance: number;
  onClose: () => void;
}) {
  const [transactions, setTransactions] = useState<
    Array<{
      id: string;
      amount: number;
      balance: number;
      type: string;
      description: string | null;
      createdAt: string;
    }>
  >([]);

  const refreshTransactions = useCallback(() => {
    fetch("/api/user/credits")
      .then((r) => r.json())
      .then((data) => {
        if (data.transactions) setTransactions(data.transactions);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshTransactions();
    // 监听积分变化事件，自动刷新流水列表
    const handler = () => refreshTransactions();
    window.addEventListener('credits:changed', handler);
    return () => window.removeEventListener('credits:changed', handler);
  }, [refreshTransactions]);

  const typeEmoji: Record<string, string> = {
    initial: "🎁",
    purchase: "💰",
    consume: "⚡",
    admin: "🛠️",
    redeem: "🎫",
  };

  return (
    <div className="fixed inset-0 z-[60]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-[52px] right-[1.5rem] sm:right-[3rem] bg-[#12121a] border border-[rgba(212,168,83,0.15)] rounded-2xl p-5 w-[340px] shadow-2xl" style={{ zIndex: 61 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555] hover:text-[#e8e6e3] transition-colors"
        >
          ✕
        </button>

        <h3 className={`font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-1`}>
          积分中心
        </h3>
        <div className="text-center my-5">
          <div className="text-4xl font-bold" style={{ color: colors.goldPrimary }}>
            {balance}
          </div>
          <div className="text-xs text-[#555] mt-1">当前积分余额</div>
        </div>

        <div className="max-h-[240px] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="text-center text-[#555] text-sm py-4">暂无流水记录</div>
          ) : (
            transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] text-xs"
              >
                <div className="flex items-center gap-2">
                  <span>{typeEmoji[t.type] || "📋"}</span>
                  <span className="text-[#9a9590]">{t.description || t.type}</span>
                </div>
                <div className="text-right">
                  <span
                    style={{
                      color: t.amount > 0 ? "#5cb85c" : "#d9534f",
                      fontWeight: 600,
                    }}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount}
                  </span>
                  <div className="text-[#555] scale-90 origin-right">
                    余额:{t.balance}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="text-[10px] text-[#444] text-center mt-4">
          AI答问每次10积分 · 打赏1元=2积分 · 兑换码可获取积分
        </p>
      </motion.div>
    </div>
  );
}

/* ========== 主导航栏组件 ========== */
export default function Navbar() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.balance ?? 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCredits();
      // 注册全局刷新方法，供 DonationModal 成功后调用
      (window as unknown as Record<string, () => void>).__refreshNavbarCredits = fetchCredits;

      // 监听全局积分变更事件（管理员操作/打赏等触发）
      const handleCreditsChanged = () => fetchCredits();
      window.addEventListener('credits:changed', handleCreditsChanged);

      // 页面重新可见时自动刷新积分（防过期）
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') fetchCredits();
      };
      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('focus', handleVisibility);

      return () => {
        window.removeEventListener('credits:changed', handleCreditsChanged);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('focus', handleVisibility);
      };
    }
  }, [status, fetchCredits]);

  // Static nav items - no pathname dependency
  const navItems = [
    {
      label: "溯源",
      href: "/#溯源",
      subItems: [
        { label: "纳音五行全说", href: "/posts/na-yin-wu-xing-quan-shuo" },
        { label: "天干五合数理推演", href: "/posts/tian-gan-wu-he" },
      ],
    },
    {
      label: "杂谈",
      href: "/#杂谈",
      subItems: [
        { label: "验证玄学天赋", href: "/posts/tong-zi-ming" },
      ],
    },
  ];

  const linkClass = `${fontSizes.bodySm} px-2 py-1 rounded-lg transition-all duration-300 hover:text-[${colors.goldPrimary}]`;

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

          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/" className={linkClass} style={{ color: colors.textSecondary }}>
              首页
            </Link>

            {navItems.map((item) => (
              <div key={item.label} className="relative group">
                <Link
                  href={item.href}
                  className={`${linkClass} flex items-center gap-1`}
                  style={{ color: colors.textSecondary }}
                >
                  {item.label}
                  <svg className="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 8L2 4h8z" />
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
              <span className={fontSizes.caption} style={{ color: colors.textTertiary }}>
                ...
              </span>
            ) : session?.user ? (
              <div className="relative flex items-center gap-2">
                {/* 积分胶囊 */}
                {credits !== null && (
                  <button
                    onClick={() => setShowCreditsModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #d4a853, #b8860b)",
                      color: "#fff",
                    }}
                    title="点击查看积分详情"
                  >
                    💰 {credits}
                  </button>
                )}

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

                {/* 积分明细弹窗 */}
                <AnimatePresence>
                  {showCreditsModal && credits !== null && (
                    <CreditsModal
                      balance={credits}
                      onClose={() => setShowCreditsModal(false)}
                    />
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

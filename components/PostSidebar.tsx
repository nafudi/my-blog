"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { colors, fonts, fontSizes } from "@/lib/theme";

interface PostMeta {
  slug: string;
  title: string;
  icon?: string;
  category?: string;
}

interface CategoryGroup {
  name: string;
  posts: PostMeta[];
}

// 戏算分类下的固定页签（内部路由，无白闪）
const XI_SUAN_FIXED_LINKS = [
  {
    key: "bazi-paipan",
    title: "八字排盘",
    icon: "🔮",
    href: "/bazi",
  },
];

// 自省分类下的固定页签
const ZI_XING_LINKS = [
  {
    key: "mood-notes",
    title: "情绪笔记",
    icon: "📝",
    href: "/mood-notes",
  },
];

// 我的后台固定页签
const MY_DASHBOARD_LINKS = [
  {
    key: "my-dashboard",
    title: "我的后台",
    icon: "👤",
    href: "/dashboard",
  },
];

// Module-level cache so data persists across navigations
let cachedPosts: PostMeta[] | null = null;
let cachedCategories: CategoryGroup[] | null = null;

export default function PostSidebar() {
  const [posts, setPosts] = useState<PostMeta[]>(cachedPosts || []);
  const [categories, setCategories] = useState<CategoryGroup[]>(cachedCategories || []);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  // 兑换码状态
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<string | null>(null);

  const pathname = usePathname();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

          fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const groupMap: Record<string, PostMeta[]> = {};
          for (const post of data) {
            const cat = post.category || "未分类";
            if (!groupMap[cat]) groupMap[cat] = [];
            groupMap[cat].push(post);
          }

          // 确保戏算分类存在（即使没有文章也要显示，因为有固定页签）
          if (!groupMap["戏算"]) groupMap["戏算"] = [];

          // 定义分类排序：戏算第一，杂谈第二，溯源第三，其他按原顺序
          const sortOrder: Record<string, number> = {
            "戏算": 1,
            "杂谈": 2,
            "溯源": 3,
          };
          const sortedEntries = Object.entries(groupMap).sort((a, b) => {
            const orderA = sortOrder[a[0]] || 999;
            const orderB = sortOrder[b[0]] || 999;
            return orderA - orderB;
          });
          const groups = sortedEntries.map(([name, posts]) => ({
            name,
            posts,
          }));

          cachedPosts = data;
          cachedCategories = groups;

          setPosts(data);
          setCategories(groups);
          // 默认全折叠，用户手动展开
          // setExpandedCats(new Set(Object.keys(groupMap)));
        }
      })
      .catch(console.error);
  }, []);

  const toggleCat = (catName: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    const code = redeemCode.trim();
    if (!code || code.length < 4) return;
    setRedeemLoading(true);
    setRedeemResult(null);
    try {
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) {
        setRedeemResult("✅ " + data.message + "（余额：" + data.newBalance + ")");
        setRedeemCode("");
        try { window.dispatchEvent(new Event('credits:changed')); } catch(_) {}
      } else {
        setRedeemResult("❌ " + (data.error || "未知错误"));
      }
    } catch { setRedeemResult("❌ 网络错误"); }
    setRedeemLoading(false);
  }


  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Expand the category containing the current article
  useEffect(() => {
    if (categories.length === 0) return;
    const currentCat = categories.find((cat) =>
      cat.posts.some((p) => pathname === `/posts/${p.slug}`)
    );
    if (currentCat) {
      setExpandedCats((prev) => {
        if (prev.has(currentCat.name)) return prev;
        const next = new Set(prev);
        next.add(currentCat.name);
        return next;
      });
    }
  }, [pathname, categories]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-0 z-50 lg:hidden w-8 h-16 backdrop-blur-sm border border-l-0 rounded-r-xl flex items-center justify-center transition-all"
        style={{
          background: "rgba(18,18,26,0.9)",
          borderColor: "rgba(212,168,83,0.15)",
          color: colors.goldPrimary,
          boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
        }}
      >
        <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          {isOpen ? "✕" : "☰"}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 backdrop-blur-xl border-r z-40 transition-transform duration-300 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        style={{
          background: "rgba(13,13,21,0.85)",
          borderColor: "rgba(212,168,83,0.1)",
        }}
      >
        <div className="p-4 pt-4">
          <h2
            className={`${fonts.heading} ${fontSizes.h4} mb-4 px-2`}
            style={{ color: colors.goldPrimary }}
          >
            📚 文章目录
          </h2>

          {categories.length === 0 ? (
            <p className={`${fontSizes.bodySm} px-2`} style={{ color: colors.textTertiary }}>
              {hasFetched.current ? "暂无文章" : "加载中..."}
            </p>
          ) : (
            <div className="space-y-1">
              {categories.map((cat) => {
                const isExpanded = expandedCats.has(cat.name);
                const isActiveCat =
                  cat.posts.some((p) => pathname === `/posts/${p.slug}`) ||
                  (cat.name === "戏算" && XI_SUAN_FIXED_LINKS.some((l) => pathname === l.href));
                // 戏算分类的固定页签数量
                const fixedLinksCount = cat.name === "戏算" ? XI_SUAN_FIXED_LINKS.length : 0;
                const totalCount = cat.posts.length + fixedLinksCount;
                return (
                  <div key={cat.name}>
                    <button
                      onClick={() => toggleCat(cat.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${fontSizes.bodySm}`}
                      style={{
                        color: isActiveCat ? colors.goldPrimary : colors.textSecondary,
                        background: isActiveCat ? "rgba(212,168,83,0.1)" : "transparent",
                      }}
                    >
                      <span
                        className={`text-xs transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                      >
                        ▶
                      </span>
                      <span className="font-medium truncate flex-1">
                        {cat.name}
                      </span>
                      <span
                        className={`${fontSizes.caption} px-1.5 py-0.5 rounded-full`}
                        style={{
                          color: colors.textTertiary,
                          background: "rgba(212,168,83,0.08)",
                        }}
                      >
                        {totalCount}
                      </span>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="pl-5 pr-1 py-1 space-y-0.5">
                        {cat.posts.map((post) => {
                          const isActive = pathname === `/posts/${post.slug}`;
                          return (
                            <Link
                              key={post.slug}
                              href={`/posts/${post.slug}`}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${fontSizes.bodySm}`}
                              style={{
                                color: isActive ? colors.goldPrimary : colors.textSecondary,
                                background: isActive ? "rgba(212,168,83,0.12)" : "transparent",
                              }}
                            >
                              <span className="text-base">{post.icon || "📄"}</span>
                              <span className="truncate flex-1">{post.title}</span>
                              {isActive && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: colors.goldPrimary }}
                                />
                              )}
                            </Link>
                          );
                        })}

                        {/* 戏算分类下的固定内链页签 */}
                        {cat.name === "戏算" &&
                          XI_SUAN_FIXED_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                              <Link
                                key={link.key}
                                href={link.href}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${fontSizes.bodySm}`}
                                style={{
                                  color: isActive ? colors.goldPrimary : colors.textSecondary,
                                  background: isActive ? "rgba(212,168,83,0.12)" : "transparent",
                                }}
                              >
                                <span className="text-base">{link.icon}</span>
                                <span className="truncate flex-1">{link.title}</span>
                                {isActive && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: colors.goldPrimary }}
                                  />
                                )}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ===== 自省分区 ===== */}
              <div>
                <button
                  onClick={() => toggleCat("__zi_xing__")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${fontSizes.bodySm}`}
                  style={{
                    color: ZI_XING_LINKS.some(l => pathname === l.href) ? colors.goldPrimary : colors.textSecondary,
                    background: ZI_XING_LINKS.some(l => pathname === l.href) ? "rgba(212,168,83,0.1)" : "transparent",
                  }}
                >
                  <span
                    className={`text-xs transition-transform duration-200 ${
                      expandedCats.has("__zi_xing__") ? "rotate-90" : ""
                    }`}
                  >
                    ▶
                  </span>
                  <span className="font-medium truncate flex-1">自省</span>
                  <span
                    className={`${fontSizes.caption} px-1.5 py-0.5 rounded-full`}
                    style={{
                      color: colors.textTertiary,
                      background: "rgba(212,168,83,0.08)",
                    }}
                  >
                    {ZI_XING_LINKS.length}
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    expandedCats.has("__zi_xing__") ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-5 pr-1 py-1 space-y-0.5">
                    {ZI_XING_LINKS.map((link) => {
                      const isActive = pathname === link.href;
                      return (
                        <Link
                          key={link.key}
                          href={link.href}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all ${fontSizes.bodySm}`}
                          style={{
                            color: isActive ? colors.goldPrimary : colors.textSecondary,
                            background: isActive ? "rgba(212,168,83,0.12)" : "transparent",
                          }}
                        >
                          <span className="text-base">{link.icon}</span>
                          <span className="truncate flex-1">{link.title}</span>
                          {isActive && (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: colors.goldPrimary }}
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

              {/* ===== 我的后台 ===== */}
              <div>
                {MY_DASHBOARD_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.key}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${fontSizes.bodySm}`}
                      style={{
                        color: isActive ? colors.goldPrimary : colors.textSecondary,
                        background: isActive ? "rgba(212,168,83,0.12)" : "transparent",
                      }}
                    >
                      <span className="text-base">{link.icon}</span>
                      <span className="truncate flex-1 font-medium">{link.title}</span>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: colors.goldPrimary }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

          <div
            className="my-6 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent)",
            }}
          />

          {/* 兑换码入口 */}
          <div className="mb-3">
            <p className={"text-xs mb-2 px-1"} style={{ color: colors.textTertiary }}>🎫 积分兑换</p>
            <form onSubmit={handleRedeem} className="space-y-2">
              <input
                value={redeemCode}
                onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); setRedeemResult(null); }}
                placeholder="输入兑换码"
                disabled={redeemLoading}
                maxLength={16}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(212,168,83,0.15)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.4)] placeholder:text-[#444] disabled:opacity-50 font-mono tracking-wider"
              />
              <button
                type="submit"
                disabled={redeemLoading || !redeemCode.trim()}
                className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                style={{
                  background: redeemLoading ? "#333" : "linear-gradient(90deg,#d4a853,#a67c3d)",
                  color: "#0a0a0f",
                  cursor: (!redeemLoading && redeemCode.trim()) ? "pointer" : "not-allowed",
                }}
              >
                {redeemLoading ? "兑换中..." : "立即兑换"}
              </button>
            </form>
            {redeemResult && (
              <div className={"text-xs mt-2 px-2 py-1.5 rounded-md break-all " + (redeemResult.includes("✅") ? "text-[#5cb85c] bg-[rgba(92,184,92,0.08)]" : "text-[#d9534f] bg-[rgba(217,83,79,0.08)]")}>
                {redeemResult}
              </div>
            )}
          </div>

          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${fontSizes.bodySm}`}
            style={{
              color: pathname === "/" ? colors.goldPrimary : colors.textSecondary,
              background: pathname === "/" ? "rgba(212,168,83,0.15)" : "transparent",
            }}
          >
            <span className="text-lg">🏠</span>
            <span className="font-medium">返回首页</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-center" style={{ color: colors.textMuted }}>
            <p className={fontSizes.caption}>✦ 探索传统文化</p>
          </div>
        </div>
      </aside>
    </>
  );
}

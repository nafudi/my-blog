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

// Module-level cache so data persists across navigations
let cachedPosts: PostMeta[] | null = null;
let cachedCategories: CategoryGroup[] | null = null;

export default function PostSidebar() {
  const [posts, setPosts] = useState<PostMeta[]>(cachedPosts || []);
  const [categories, setCategories] = useState<CategoryGroup[]>(cachedCategories || []);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
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
          const groups = Object.entries(groupMap).map(([name, posts]) => ({
            name,
            posts,
          }));

          cachedPosts = data;
          cachedCategories = groups;

          setPosts(data);
          setCategories(groups);
          setExpandedCats(new Set(Object.keys(groupMap)));
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
                const isActiveCat = cat.posts.some(
                  (p) => pathname === `/posts/${p.slug}`
                );
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
                        {cat.posts.length}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="my-6 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent)",
            }}
          />

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

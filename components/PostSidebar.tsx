"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function PostSidebar() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
          // 按 category 分组
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
          setCategories(groups);
          // 默认全部展开
          setExpandedCats(new Set(Object.keys(groupMap)));
        }
      })
      .catch(console.error);
  }, []);

  // 切换分类展开/折叠
  const toggleCat = (catName: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  // 关闭侧边栏当导航到新页面
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* 移动端切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-1/2 -translate-y-1/2 left-0 z-50 lg:hidden w-8 h-16 bg-[#12121a]/90 backdrop-blur-sm border border-[rgba(212,168,83,0.15)] border-l-0 rounded-r-xl flex items-center justify-center text-[#d4a853] hover:bg-[#1a1a2e] transition-all"
        style={{ boxShadow: "2px 0 10px rgba(0,0,0,0.3)" }}
      >
        <span className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
          {isOpen ? "✕" : "☰"}
        </span>
      </button>

      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0d0d15]/30 backdrop-blur-md border-r border-[rgba(212,168,83,0.1)] z-40 transition-transform duration-300 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(212,168,83,0.3)] scrollbar-track-transparent pt-20 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-4">
          <h2 className="font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-4 px-2">
            📚 文章目录
          </h2>

          {categories.length === 0 && (
            <p className="text-sm text-[#555] px-2">暂无文章</p>
          )}

          <div className="space-y-1">
            {categories.map((cat) => {
              const isExpanded = expandedCats.has(cat.name);
              const isActiveCat = cat.posts.some(
                (p) => pathname === `/posts/${p.slug}`
              );
              return (
                <div key={cat.name}>
                  {/* 分类标题 - 可点击展开/折叠 */}
                  <button
                    onClick={() => toggleCat(cat.name)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                      isActiveCat
                        ? "text-[#d4a853] bg-[rgba(212,168,83,0.1)]"
                        : "text-[#9a9590] hover:bg-[rgba(212,168,83,0.06)] hover:text-[#e8e6e3]"
                    }`}
                  >
                    <span
                      className={`text-xs transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      ▶
                    </span>
                    <span className="text-sm font-medium truncate flex-1">
                      {cat.name}
                    </span>
                    <span className="text-xs text-[#555] bg-[rgba(212,168,83,0.08)] px-1.5 py-0.5 rounded-full">
                      {cat.posts.length}
                    </span>
                  </button>

                  {/* 分类下的文章列表 */}
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
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-all text-sm ${
                              isActive
                                ? "bg-[rgba(212,168,83,0.12)] text-[#d4a853]"
                                : "text-[#9a9590] hover:bg-[rgba(212,168,83,0.06)] hover:text-[#e8e6e3]"
                            }`}
                          >
                            <span className="text-base">{post.icon || "📄"}</span>
                            <span className="truncate flex-1">{post.title}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a853]" />
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

          {/* 分隔线 */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgba(212,168,83,0.2)] to-transparent" />

          {/* 首页链接 */}
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
              pathname === "/"
                ? "bg-[rgba(212,168,83,0.15)] text-[#d4a853]"
                : "text-[#9a9590] hover:bg-[rgba(212,168,83,0.08)] hover:text-[#e8e6e3]"
            }`}
          >
            <span className="text-lg">🏠</span>
            <span className="font-medium">返回首页</span>
          </Link>
        </div>

        {/* 底部装饰 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-center text-xs text-[#333]">
            <p>✦ 探索传统文化</p>
          </div>
        </div>
      </aside>
    </>
  );
}

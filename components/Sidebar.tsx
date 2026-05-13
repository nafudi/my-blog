"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface SidebarProps {
  toc: TocItem[];
  activeId: string | null;
}

function Sidebar({ toc, activeId }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 滚动时自动高亮当前章节
  return (
    <>
      {/* 移动端切换按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#d4a853] text-[#0a0a0f] flex items-center justify-center shadow-lg shadow-[rgba(212,168,83,0.3)]"
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {/* 侧边栏 */}
      <AnimatePresence>
        {(isOpen || typeof window !== "undefined" && window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: isOpen ? 300 : 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed lg:sticky top-16 left-0 lg:left-auto w-72 h-[calc(100vh-4rem)] bg-[#12121a]/95 backdrop-blur-xl border-r border-[rgba(212,168,83,0.1)] overflow-y-auto p-6 z-40 ${
              isOpen ? "" : "hidden lg:block"
            }`}
          >
            <div className="mb-6">
              <h2
                className="font-[family-name:var(--font-ma-shan)] text-lg text-[#ffffff] mb-1"
              >
                目录
              </h2>
              <div className="w-10 h-[2px] bg-gradient-to-r from-[#d4a853] to-transparent" />
            </div>

            {toc.length === 0 ? (
              <p className="text-sm text-[#aaaaaa]">暂无目录</p>
            ) : (
              <nav>
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsOpen(false);
                        }}
                        className={`block text-sm py-1 px-3 rounded-lg transition-all duration-200 ${
                          activeId === item.id
                            ? "bg-[rgba(212,168,83,0.15)] text-[#ffffff] border-l-2 border-[#d4a853]"
                            : "text-[#cccccc] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.03)]"
                        }`}
                        style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 遮罩（移动端） */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>
    </>
  );
}

// 导出一个 hook 用于监听滚动位置，自动更新 activeId
export function useActiveToc(toc: TocItem[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const item of toc) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [toc]);

  return activeId;
}

export default Sidebar;

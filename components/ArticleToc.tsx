"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface ArticleTocProps {
  toc: TocItem[];
}

export default function ArticleToc({ toc }: ArticleTocProps) {
  const [activeId, setActiveId] = useState<string>("");

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
      { rootMargin: "-80px 0px -60% 0px" }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (toc.length === 0) return null;

  return (
    <div className="w-full">
      {/* 标题 */}
      <h3
        className="text-base font-bold mb-4 tracking-wider flex items-center gap-2"
        style={{ color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.25)" }}
      >
        <span className="text-lg">📑</span>
        <span>本文目录</span>
      </h3>

      {/* 目录项 */}
      <nav className="space-y-1">
        {toc.map((item) => {
          const isActive = activeId === item.id;
          const isLevel2 = item.level === 2;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="block w-full text-left rounded transition-all leading-relaxed cursor-pointer"
              style={{
                fontSize: isLevel2 ? "0.85rem" : "0.95rem",
                padding: isLevel2 ? "3px 6px 3px 16px" : "5px 8px",
                color: isActive ? "#FFD700" : isLevel2 ? "#a09070" : "#c8b880",
                background: isActive
                  ? "rgba(255,215,0,0.12)"
                  : "transparent",
                borderLeft: isActive
                  ? "3px solid #FFD700"
                  : "3px solid transparent",
                textShadow: isActive ? "0 0 6px rgba(255,215,0,0.3)" : "none",
                fontWeight: isLevel2 ? 400 : 500,
              }}
            >
              {item.title}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

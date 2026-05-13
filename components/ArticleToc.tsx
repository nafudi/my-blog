"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
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
    <aside className="hidden lg:block w-44 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
        <h3
          className="text-sm font-bold mb-3 tracking-wide"
          style={{ color: "#d4a853" }}
        >
          📑 本文目录
        </h3>
        <nav className="space-y-0.5">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className="block w-full text-left text-xs py-1.5 px-2 rounded transition-all leading-relaxed cursor-pointer"
                style={{
                  color: isActive ? "#d4a853" : "#888888",
                  background: isActive
                    ? "rgba(212,168,83,0.1)"
                    : "transparent",
                  borderLeft: isActive
                    ? "2px solid #d4a853"
                    : "2px solid transparent",
                }}
              >
                {item.title}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

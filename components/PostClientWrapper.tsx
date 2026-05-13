"use client";

import Comments from "@/components/Comments";
import DonationModal from "@/components/DonationModal";
import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface PostClientWrapperProps {
  slug: string;
  postTitle: string;
  postDescription?: string;
}

function useActiveToc(toc: TocItem[]) {
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

export default function PostClientWrapper({
  slug,
  postTitle,
  postDescription,
}: PostClientWrapperProps) {
  const [html, setHtml] = useState<string>("");
  const [styles, setStyles] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const activeId = useActiveToc(toc);

  useEffect(() => {
    fetch(`/content/${slug}/index.html`)
      .then((res) => res.text())
      .then((text) => {
        // Extract styles
        const styleMatch = text.match(/<style[^>]*>([\s\S]*)<\/style>/i);
        if (styleMatch) {
          setStyles(styleMatch[1]);
        }

        // Extract body content
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : text;

        // Add ids to h2 elements for TOC linking
        let index = 0;
        const processedHtml = bodyContent.replace(
          /<h2[^>]*>(.*?)<\/h2>/gi,
          (match, innerHtml) => {
            const title = innerHtml.replace(/<[^>]*>/g, "");
            const id = `section-${index++}`;
            return `<h2 id="${id}" ${match.slice(3)}`;
          }
        );

        setHtml(processedHtml);

        // Parse TOC from h2 elements
        const h2Matches = bodyContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
        const parsedToc: TocItem[] = [];
        let tocIndex = 0;
        for (const match of h2Matches) {
          const title = match[1].replace(/<[^>]*>/g, "");
          parsedToc.push({ id: `section-${tocIndex}`, title, level: 1 });
          tocIndex++;
        }
        setToc(parsedToc);
      });
  }, [slug]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 relative">
      {/* Inject article styles */}
      {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}

      {/* Mobile TOC toggle */}
      <button
        onClick={() => setTocOpen(!tocOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#d4a853] text-[#0a0a0f] flex items-center justify-center shadow-lg shadow-[rgba(212,168,83,0.3)]"
      >
        {tocOpen ? "\u2715" : "\u2630"}
      </button>

      {/* Mobile TOC overlay */}
      {tocOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setTocOpen(false)}
        />
      )}

      {/* Desktop TOC sidebar */}
      {toc.length > 0 && (
        <aside
          className={`fixed top-16 right-0 w-60 h-[calc(100vh-4rem)] bg-[#0d0d15]/95 backdrop-blur-xl border-l border-[rgba(212,168,83,0.1)] overflow-y-auto p-5 z-40 transition-transform duration-300 ${
            tocOpen ? "translate-x-0" : "translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="mb-5">
            <h2
              className="font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-1"
            >
              本篇目录
            </h2>
            <div className="w-10 h-[2px] bg-gradient-to-r from-[#d4a853] to-transparent" />
          </div>
          <nav>
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${
                      activeId === item.id
                        ? "bg-[rgba(212,168,83,0.15)] text-[#ffffff] border-l-2 border-[#d4a853]"
                        : "text-[#cccccc] hover:text-[#e8e6e3] hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 12}px` }}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}

      {/* Main content area with padding for TOC */}
      <div className="lg:pr-60">
        <article
          id="article-content"
          className="article-content px-4 sm:px-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="flex items-center justify-between mt-8 mx-4 sm:mx-6 px-4 py-3 bg-[#12121a]/50 rounded-xl border border-[rgba(212,168,83,0.08)]">
          <span className="text-sm text-[#aaaaaa]">
            如果觉得有帮助，可以打赏支持作者
          </span>
          <DonationModal postSlug={slug} postTitle={postTitle} />
        </div>

        <div id="comments-section" className="px-4 sm:px-6">
          <Comments postSlug={slug} />
        </div>
      </div>
    </div>
  );
}

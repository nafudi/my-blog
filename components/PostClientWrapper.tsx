"use client";

import { useActiveToc } from "@/components/Sidebar";
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

export default function PostClientWrapper({
  slug,
  postTitle,
  postDescription,
}: PostClientWrapperProps) {
  const [html, setHtml] = useState<string>("");
  const [styles, setStyles] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([
    { id: "article-content", title: "正文内容", level: 1 },
    { id: "comments-section", title: "留言区", level: 1 },
  ]);
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
        setHtml(bodyContent);
        
        // Parse TOC from h2 elements
        const h2Matches = bodyContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
        const parsedToc: TocItem[] = [];
        for (const match of h2Matches) {
          const title = match[1].replace(/<[^>]*>/g, ""); // Strip HTML tags
          const id = title.replace(/\s+/g, "-").toLowerCase();
          parsedToc.push({ id, title, level: 1 });
        }
        if (parsedToc.length > 0) {
          setToc([...parsedToc, { id: "comments-section", title: "留言区", level: 1 }]);
        }
      });
  }, [slug]);

  return (
    <div className="flex-1 min-w-0">
      {/* Inject article styles */}
      {styles && <style dangerouslySetInnerHTML={{ __html: styles }} />}
      
      <article
        id="article-content"
        className="article-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex items-center justify-between mt-8 px-4 py-3 bg-[#12121a]/50 rounded-xl border border-[rgba(212,168,83,0.08)]">
        <span className="text-sm text-[#aaaaaa]">
          如果觉得有帮助，可以打赏支持作者
        </span>
        <DonationModal postSlug={slug} postTitle={postTitle} />
      </div>

      <Comments postSlug={slug} />
    </div>
  );
}

export { useActiveToc } from "@/components/Sidebar";

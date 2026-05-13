"use client";

import { useActiveToc } from "@/components/Sidebar";
import Comments from "@/components/Comments";
import DonationModal from "@/components/DonationModal";
import { useEffect, useState } from "react";

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
  const toc = [
    { id: "article-content", title: "正文内容", level: 1 },
    { id: "comments-section", title: "留言区", level: 1 },
  ];
  const activeId = useActiveToc(toc);

  useEffect(() => {
    fetch(`/content/${slug}/index.html`)
      .then((res) => res.text())
      .then((text) => {
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          setHtml(bodyMatch[1]);
        } else {
          setHtml(text);
        }
      });
  }, [slug]);

  return (
    <div className="flex-1 min-w-0">
      <article
        id="article-content"
        className="text-[#e8e6e3] leading-relaxed"
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

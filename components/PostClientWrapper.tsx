"use client";

import { useActiveToc } from "@/components/Sidebar";
import Comments from "@/components/Comments";
import DonationModal from "@/components/DonationModal";

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
  const toc = [
    { id: "article-content", title: "正文内容", level: 1 },
    { id: "comments-section", title: "留言区", level: 1 },
  ];
  const activeId = useActiveToc(toc);

  return (
    <div className="flex-1 min-w-0">
      {/* 文章内容 iframe */}
      <article
        id="article-content"
        className=""
      >
        <iframe
          src={`/content/${slug}/index.html`}
          className="w-full border-0"
          style={{
            minHeight: "70vh",
            background: "#0a0a0f",
          }}
          title="文章内容"
          sandbox="allow-scripts allow-same-origin"
        />
      </article>

      {/* 打赏栏 */}
      <div className="flex items-center justify-between mt-8 px-4 py-3 bg-[#12121a]/50 rounded-xl border border-[rgba(212,168,83,0.08)]">
        <span className="text-sm text-[#aaaaaa]">
          如果觉得有帮助，可以打赏支持作者
        </span>
        <DonationModal postSlug={slug} postTitle={postTitle} />
      </div>

      {/* 评论区域 */}
      <Comments postSlug={slug} />
    </div>
  );
}

export { useActiveToc } from "@/components/Sidebar";

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
        const styleMatch = text.match(/<style[^>]*>([\s\S]*)<\/style>/i);
        if (styleMatch) {
          setStyles(styleMatch[1]);
        }
        
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : text;
        setHtml(bodyContent);
        
        const h2Matches = bodyContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
        const parsedToc: TocItem[] = [];
        for (const match of h2Matches) {
          const title = match[1].replace(/<[^>]*>/g, "");
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
      {/* 统一文章样式注入 */}
      <style>{articleBaseCSS}</style>
      
      {/* 文章自定义样式（权重高于基础样式） */}
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

// ========== 统一文章基础样式 ==========
const articleBaseCSS = `
/* 文章内容统一样式框架 */
.article-content {
  color: #e8e6e3;
  line-height: 1.9;
  font-size: 1.05rem;
  max-width: 100%;
}

/* 标题层级 */
.article-content h1 {
  font-size: 2.2em;
  font-weight: 700;
  color: #ffffff;
  margin: 1.5em 0 0.8em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid rgba(212,168,83,0.2);
  line-height: 1.3;
}

.article-content h1:first-child {
  margin-top: 0;
}

.article-content h2 {
  font-size: 1.5em;
  font-weight: 700;
  color: #d4a853;
  margin: 2em 0 1em;
  padding-left: 0.6em;
  border-left: 3px solid #d4a853;
  line-height: 1.4;
}

.article-content h3 {
  font-size: 1.2em;
  font-weight: 600;
  color: #e0c878;
  margin: 1.5em 0 0.8em;
  line-height: 1.4;
}

.article-content h4 {
  font-size: 1.05em;
  font-weight: 600;
  color: #cccccc;
  margin: 1.2em 0 0.6em;
}

/* 段落 */
.article-content p {
  margin: 0.8em 0;
  text-align: justify;
}

/* 链接 */
.article-content a {
  color: #d4a853;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.article-content a:hover {
  color: #e8c878;
}

/* 列表 */
.article-content ul, .article-content ol {
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.article-content li {
  margin: 0.3em 0;
  line-height: 1.7;
}

/* 引用 */
.article-content blockquote {
  border-left: 3px solid rgba(212,168,83,0.3);
  margin: 1em 0;
  padding: 0.5em 1em;
  background: rgba(212,168,83,0.05);
  border-radius: 0 8px 8px 0;
  color: #cccccc;
}

/* 表格 */
.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95em;
  overflow-x: auto;
  display: block;
}
.article-content thead {
  background: rgba(212,168,83,0.1);
}
.article-content th {
  padding: 0.7em 0.8em;
  text-align: left;
  color: #d4a853;
  font-weight: 600;
  border-bottom: 2px solid rgba(212,168,83,0.3);
  white-space: nowrap;
}
.article-content td {
  padding: 0.6em 0.8em;
  border-bottom: 1px solid rgba(212,168,83,0.08);
  vertical-align: top;
}
.article-content tr:hover td {
  background: rgba(212,168,83,0.03);
}

/* 代码 */
.article-content code {
  background: rgba(212,168,83,0.1);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  color: #e8c878;
}
.article-content pre {
  background: rgba(10,10,15,0.8);
  border: 1px solid rgba(212,168,83,0.15);
  border-radius: 12px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
}
.article-content pre code {
  background: none;
  padding: 0;
  color: #e8e6e3;
}

/* 分割线 */
.article-content hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent);
  margin: 2em 0;
}

/* 图片 */
.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

/* 强调 */
.article-content strong {
  color: #ffffff;
  font-weight: 600;
}

/* 小屏幕适配 */
@media (max-width: 640px) {
  .article-content {
    font-size: 1rem;
  }
  .article-content h1 { font-size: 1.6em; }
  .article-content h2 { font-size: 1.3em; }
  .article-content h3 { font-size: 1.1em; }
}
`;

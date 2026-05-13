import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import PostContentClient from "@/components/PostClientWrapper";
import ArticleToc from "@/components/ArticleToc";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function parseTocFromHtml(html: string): TocItem[] {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  const items: TocItem[] = [];

  // 按文档顺序提取 h2（一级标题）和 h3（二级标题）
  const allHeadings = [
    ...body.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi),
  ];

  for (const match of allHeadings) {
    const tagLevel = parseInt(match[1]); // 2 or 3
    const rawTitle = match[2];
    const title = rawTitle.replace(/<[^>]*>/g, "").trim();
    if (!title) continue;

    const id = title.replace(/\s+/g, "-").toLowerCase();
    items.push({
      id,
      title,
      level: tagLevel === 2 ? 1 : 2, // h2 → 一级, h3 → 二级
    });
  }

  return items;
}

function extractSubtitle(html: string): string | null {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  const match = body.match(
    /class=["'][^"']*subtitle["'][^>]*>(.*?)<\/[^>]*>/i
  );
  return match ? match[1].replace(/<[^>]*>/g, "").trim() : null;
}

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // 读取文章 HTML 解析目录和副标题
  const htmlPath = path.join(
    process.cwd(),
    "public",
    "content",
    slug,
    "index.html"
  );
  let toc: TocItem[] = [];
  let subtitle: string | null = null;

  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, "utf-8");
    toc = parseTocFromHtml(html);
    subtitle = extractSubtitle(html);
  }

  return (
    <div className="relative">
      {/* ===== 左侧悬浮目录（fixed 定位，垂直居中，更靠左） ===== */}
      <aside
        className="hidden lg:block fixed z-30"
        style={{
          left: "268px",
          top: "50%",
          transform: "translateY(-50%)",
          maxHeight: "80vh",
          overflowY: "auto",
          width: "200px",
          paddingRight: "8px",
        }}
      >
        <ArticleToc toc={toc} />
      </aside>

      {/* ===== 正文内容（给 TOC 留左侧空间，并在内容框内居中） ===== */}
      <div className="lg:pl-52">
        <div className="max-w-3xl mx-auto">
          {/* 文章头部 */}
          <header className="mb-8">
            <div className="mb-2 flex gap-2 flex-wrap">
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-[rgba(212,168,83,0.12)] text-[#ffffff]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-[family-name:var(--font-ma-shan)] text-3xl sm:text-5xl text-[#ffffff] mb-3">
              {post.title}
            </h1>

            {subtitle && (
              <p
                className="text-base mb-3 font-medium tracking-wide"
                style={{ color: "#d4a853" }}
              >
                {subtitle}
              </p>
            )}

            <p className="text-[#cccccc] text-lg max-w-2xl leading-relaxed">
              {post.description}
            </p>

            <div className="mt-4 text-xs text-[#aaaaaa]">
              发布于 {post.date}
            </div>
          </header>

          {/* 文章正文 */}
          <PostContentClient
            slug={slug}
            postTitle={post.title}
            postDescription={post.description}
          />
        </div>
      </div>
    </div>
  );
}

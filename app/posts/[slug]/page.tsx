import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import PostContentClient from "@/components/PostClientWrapper";
import ArticleToc from "@/components/ArticleToc";

interface TocItem {
  id: string;
  title: string;
}

function parseTocFromHtml(html: string): TocItem[] {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  // 优先匹配 section-title 类的 h2
  let matches = [
    ...body.matchAll(
      /<h2[^>]*class=["'][^"']*section-title[^"']*["'][^>]*>(.*?)<\/h2>/gi
    ),
  ];

  // 如果没有 section-title，匹配所有 h2
  if (matches.length === 0) {
    matches = [...body.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  }

  return matches.map((m) => {
    const title = m[1].replace(/<[^>]*>/g, "");
    const id = title.replace(/\s+/g, "-").toLowerCase();
    return { id, title };
  });
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
    <div className="flex gap-8 items-start">
      {/* 左侧悬浮目录 */}
      <ArticleToc toc={toc} />

      {/* 右侧内容 */}
      <div className="flex-1 min-w-0">
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
  );
}

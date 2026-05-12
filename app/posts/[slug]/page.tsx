import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import PostContentClient from "@/components/PostClientWrapper";

// 生成静态参数
export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

// 需要在文件顶部导入（避免循环依赖）
import { getAllPosts } from "@/lib/posts";

// 服务端组件
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

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* 页面头部 */}
      <header className="relative z-10 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-2 flex gap-2 flex-wrap">
          {post.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-[rgba(212,168,83,0.12)] text-[#d4a853]"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1
          className="font-[family-name:var(--font-ma-shan)] text-3xl sm:text-5xl text-[#d4a853] mb-3"
        >
          {post.title}
        </h1>

        <p className="text-[#9a9590] text-lg max-w-2xl leading-relaxed">
          {post.description}
        </p>

        <div className="mt-4 text-xs text-[#555]">
          发布于 {post.date}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
        <div className="flex gap-8 lg:flex-col lg:gap-0">
          {/* 文章主体 + 打赏按钮 + 评论 */}
          <PostContentClient
            slug={slug}
            postTitle={post.title}
            postDescription={post.description}
          />
        </div>
      </main>

      {/* 页脚 */}
      <footer className="relative z-10 mt-8 pt-6 border-t border-[rgba(212,168,83,0.08)] text-center px-4 pb-8">
        <a
          href="/"
          className="text-sm text-[#9a9590] hover:text-[#d4a853] transition-colors duration-300"
        >
          ← 返回首页
        </a>
      </footer>
    </div>
  );
}

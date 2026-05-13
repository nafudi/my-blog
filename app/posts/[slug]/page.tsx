import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import PostContentClient from "@/components/PostClientWrapper";
import PostSidebar from "@/components/PostSidebar";
import StarBg from "@/components/StarBg";

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

  return (
    <div className="min-h-screen relative">
      <StarBg />
      <PostSidebar />
      <div className="lg:ml-64">
        <Navbar />

        <header className="relative z-10 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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

          <p className="text-[#cccccc] text-lg max-w-2xl leading-relaxed">
            {post.description}
          </p>

          <div className="mt-4 text-xs text-[#aaaaaa]">
            发布于 {post.date}
          </div>
        </header>

        <main className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-16">
          <PostContentClient
            slug={slug}
            postTitle={post.title}
            postDescription={post.description}
          />
        </main>

        <footer className="relative z-10 mt-8 pt-6 border-t border-[rgba(212,168,83,0.08)] text-center px-4 pb-8">
          <a href="/" className="text-sm text-[#cccccc] hover:text-[#ffffff] transition-colors duration-300">
            ← 返回首页
          </a>
        </footer>
      </div>
    </div>
  );
}

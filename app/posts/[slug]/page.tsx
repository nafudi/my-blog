import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import PostContentClient from "@/components/PostClientWrapper";

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
    <>
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
    </>
  );
}

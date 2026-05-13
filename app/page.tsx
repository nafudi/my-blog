import { getAllPosts } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import CardGrid from "@/components/CardGrid";
import PostSidebar from "@/components/PostSidebar";
import PageTransition from "@/components/PageTransition";
import StarBg from "@/components/StarBg";

export default function HomePage() {
  const posts = getAllPosts();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 星空背景 */}
      <StarBg />

      {/* 侧边栏 */}
      <PostSidebar />

      {/* 主内容区留出侧边栏宽度 */}
      <div className="lg:ml-64">
        {/* 导航栏 */}
        <Navbar />

        {/* 主内容 */}
        <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <PageTransition>
            {/* Hero 区域 */}
            <section className="text-center mb-16">
              <h1
                className="font-[family-name:var(--font-ma-shan)] text-5xl sm:text-7xl mb-4 glow-text"
              >
                易理
              </h1>
              <p className="text-[#9a9590] text-lg max-w-xl mx-auto leading-relaxed">
                探索传统文化的现代表达，用交互与可视化让知识生动起来
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#555]">
                <span className="w-8 h-[1px] bg-[rgba(212,168,83,0.3)]" />
                <span>学习 · 分享 · 探索</span>
                <span className="w-8 h-[1px] bg-[rgba(212,168,83,0.3)]" />
              </div>
            </section>

            {/* 文章列表 */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <h2
                  className="font-[family-name:var(--font-ma-shan)] text-2xl text-[#d4a853]"
                >
                  文章
                </h2>
                <span className="text-xs text-[#555] bg-[rgba(212,168,83,0.08)] px-2 py-0.5 rounded-full">
                  {posts.length} 篇
                </span>
              </div>

              <CardGrid posts={posts} />
            </section>
          </PageTransition>

          {/* 页脚 */}
          <footer className="relative z-10 mt-20 pt-8 border-t border-[rgba(212,168,83,0.08)] text-center">
            <p className="text-xs text-[#444]">
              Powered by Next.js & Crafted with ✨
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

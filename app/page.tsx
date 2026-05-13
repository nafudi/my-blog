import { getAllPosts } from "@/lib/posts";
import Navbar from "@/components/Navbar";
import CardGrid from "@/components/CardGrid";
import PostSidebar from "@/components/PostSidebar";
import PageTransition from "@/components/PageTransition";
import StarBg from "@/components/StarBg";
import { colors, fonts, fontSizes, lineHeights } from "@/lib/theme";

export default function HomePage() {
  const posts = getAllPosts();

  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const cat = post.category || "未分类";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(post);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarBg />
      <PostSidebar />
      <div className="lg:ml-64">
        <Navbar />
        <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <PageTransition>
            <section className="text-center mb-16">
              <h1 className={`${fonts.heading} ${fontSizes.hero} mb-4 glow-text`}>
                易理
              </h1>
              <p
                className={`${fontSizes.body} max-w-xl mx-auto ${lineHeights.relaxed}`}
                style={{ color: colors.textSecondary }}
              >
                探索传统文化的现代表达，用交互与可视化让知识生动起来
              </p>
              <div className="mt-6 flex items-center justify-center gap-2" style={{ color: colors.textMuted }}>
                <span className="w-8 h-[1px]" style={{ background: "rgba(212,168,83,0.3)" }} />
                <span className={fontSizes.bodySm}>学习 · 分享 · 探索</span>
                <span className="w-8 h-[1px]" style={{ background: "rgba(212,168,83,0.3)" }} />
              </div>
            </section>

            <div className="space-y-12">
              {Object.keys(grouped).sort().map((category) => (
                <section key={category} id={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className={`${fonts.heading} ${fontSizes.h2}`} style={{ color: colors.goldPrimary }}>
                      {category}
                    </h3>
                    <span
                      className={`${fontSizes.badge} px-2 py-0.5 rounded-full`}
                      style={{ color: colors.textTertiary, background: "rgba(212,168,83,0.08)" }}
                    >
                      {grouped[category].length} 篇
                    </span>
                    <div
                      className="flex-1 h-[1px]"
                      style={{ background: "linear-gradient(90deg, rgba(212,168,83,0.15), transparent)" }}
                    />
                  </div>
                  <CardGrid posts={grouped[category]} />
                </section>
              ))}
            </div>
          </PageTransition>

          <footer className="relative z-10 mt-20 pt-8 border-t text-center" style={{ borderColor: "rgba(212,168,83,0.08)" }}>
            <p className={fontSizes.caption} style={{ color: colors.textMuted }}>
              Powered by Next.js & Crafted with ✨
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

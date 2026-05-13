"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { colors, fonts, fontSizes, lineHeights } from "@/lib/theme";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  coverColor?: string;
  icon?: string;
  category?: string;
}

interface CardGridProps {
  posts: PostMeta[];
}

function Card({ post, index }: { post: PostMeta; index: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link href={`/posts/${post.slug}`} ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="card-hover group relative overflow-hidden rounded-2xl p-6 h-full"
        style={{
          background: post.coverColor
            ? `linear-gradient(135deg, ${post.coverColor}22 0%, ${colors.bgCard} 100%)`
            : colors.bgCard,
        }}
      >
        {/* 装饰性顶部线 */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[${colors.goldPrimary}] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `linear-gradient(90deg, transparent, ${colors.goldPrimary}, transparent)` }}
        />

        {/* 图标 */}
        <div className="text-3xl mb-4">{post.icon || "📜"}</div>

        {/* 标题 */}
        <h3
          className={`${fonts.heading} ${fontSizes.h3} mb-2 transition-colors duration-300`}
          style={{ color: colors.goldLight }}
        >
          {post.title}
        </h3>

        {/* 描述 */}
        <p
          className={`${fontSizes.bodySm} ${lineHeights.relaxed} line-clamp-3`}
          style={{ color: colors.textSecondary }}
        >
          {post.description}
        </p>

        {/* 标签 + 日期 */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {post.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`${fontSizes.tag} px-2 py-0.5 rounded-full`}
                style={{
                  background: "rgba(212,168,83,0.12)",
                  color: colors.goldPrimary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <span className={fontSizes.caption} style={{ color: colors.textTertiary }}>
            {post.date}
          </span>
        </div>

        {/* 箭头指示器 */}
        <div
          className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300"
          style={{ color: colors.goldPrimary }}
        >
          →
        </div>
      </motion.div>
    </Link>
  );
}

export default function CardGrid({ posts }: CardGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: colors.textTertiary }}>
        <span className="text-5xl mb-4">🏗️</span>
        <p className={`${fonts.heading} ${fontSizes.h4}`}>还没有文章</p>
        <p className={`${fontSizes.bodySm} mt-2`}>快让 AI 帮你创建第一篇炫酷文章吧</p>
      </div>
    );
  }

  // 按 category 分组
  const grouped = posts.reduce<Record<string, PostMeta[]>>((acc, post) => {
    const cat = post.category || "未分类";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(post);
    return acc;
  }, {});

  // 定义分类顺序
  const categoryOrder = ["溯源", "杂谈"];
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <div className="space-y-12">
      {sortedCategories.map((category) => (
        <section key={category}>
          <div className="flex items-center gap-3 mb-6">
            <h3
              className={`${fonts.heading} ${fontSizes.h2}`}
              style={{ color: colors.goldPrimary }}
            >
              {category}
            </h3>
            <span
              className={`${fontSizes.badge} px-2 py-0.5 rounded-full`}
              style={{
                color: colors.textTertiary,
                background: "rgba(212,168,83,0.08)",
              }}
            >
              {grouped[category].length} 篇
            </span>
            <div
              className="flex-1 h-[1px]"
              style={{
                background: `linear-gradient(90deg, rgba(212,168,83,0.15), transparent)`,
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped[category].map((post, i) => (
              <Card key={post.slug} post={post} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

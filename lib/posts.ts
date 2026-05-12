import { PostMeta } from "@/components/CardGrid";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

// 文章列表配置
export interface PostIndex {
  posts: PostMeta[];
}

export function getPostIndex(): PostIndex {
  const indexPath = path.join(CONTENT_DIR, "_index.json");
  if (!fs.existsSync(indexPath)) {
    return { posts: [] };
  }
  const raw = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(raw);
}

export function getAllPosts(): PostMeta[] {
  const index = getPostIndex();
  // 按日期排序（最新的在前）
  return index.posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): PostMeta | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}

export function getPostSlugs(): string[] {
  const posts = getAllPosts();
  return posts.map((p) => p.slug);
}

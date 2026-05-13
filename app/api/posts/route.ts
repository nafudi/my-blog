import { NextResponse } from "next/server";
import { getAllPosts } from "@/lib/posts";

// GET: 获取所有文章列表（供侧边栏使用）
export async function GET() {
  try {
    const posts = getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json([], { status: 200 });
  }
}

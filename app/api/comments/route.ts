import { NextRequest, NextResponse } from "next/server";
import auth from "@/lib/auth-server";
import { prisma } from "@/lib/auth";

// GET: 获取文章的评论列表（含嵌套回复）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  if (!postSlug) {
    return NextResponse.json({ error: "缺少 postSlug" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { postSlug },
    include: {
      author: { select: { name: true, email: true } },
      replies: {
        where: { parentId: { not: null } },
        include: {
          author: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const topLevelComments = comments.filter((c: { parentId: string | null }) => c.parentId === null);

  const result = topLevelComments.map((c: {
    id: string;
    content: string;
    createdAt: Date;
    author?: { name: string | null; email: string | null } | null;
    replies: Array<{
      id: string;
      content: string;
      createdAt: Date;
      author?: { name: string | null; email: string | null } | null;
    }>;
  }) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    authorName: c.author?.name || undefined,
    authorEmail: c.author?.email || undefined,
    replies: c.replies.map((r: {
      id: string;
      content: string;
      createdAt: Date;
      author?: { name: string | null; email: string | null } | null;
    }) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      authorName: r.author?.name || undefined,
      authorEmail: r.author?.email || undefined,
    })),
  }));

  return NextResponse.json(result);
}

// POST: 创建评论（需要登录）
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { content, postSlug, parentId } = await req.json();

    if (!content?.trim() || !postSlug) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "留言内容不能超过 2000 个字符" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postSlug,
        userId: session.user.id!,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(comment);
  } catch (err) {
    console.error("创建评论失败:", err);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

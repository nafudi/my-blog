import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 验证归属权：返回 null=不存在, "forbidden"=无权限, note=有权限
async function verifyOwner(noteId: string, userId: string | null) {
  const note = await prisma.moodNote.findUnique({ where: { id: noteId } });
  if (!note) return null;
  // 公开笔记：任何人可读
  if (note.isPublic) return note;
  // 私密笔记：必须登录且是本人
  if (!userId) return "forbidden";
  if (note.userId !== userId) return "forbidden";
  return note;
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await context.params;
  const userId = session?.user?.id ? (session.user.id as string) : null;

  const result = await verifyOwner(id, userId);
  if (result === null) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const note = result;

  // 附带作者信息（公开笔记需要）
  let authorInfo = {};
  if (note.isPublic) {
    const author = await prisma.user.findUnique({
      where: { id: note.userId },
      select: { id: true, name: true },
    });
    authorInfo = { authorName: author?.name || "匿名", authorId: note.userId };
  }

  // 当前用户的点赞/收藏状态
  let isLiked = false;
  let isCollected = false;
  if (userId) {
    const [liked, collected] = await Promise.all([
      prisma.moodNoteLike.findUnique({ where: { noteId_userId: { noteId: id, userId } } }).then((r) => !!r),
      prisma.moodNoteCollect.findUnique({ where: { noteId_userId: { noteId: id, userId } } }).then((r) => !!r),
    ]);
    isLiked = liked;
    isCollected = collected;
  }

  return NextResponse.json({ ...note, ...authorInfo, isLiked, isCollected });
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await context.params;
  const userId = session.user.id as string;

  const body = await req.json();
  const title = String(body.title || "").trim().slice(0, 200);
  const content = String(body.content || "").trim().slice(0, 50000);

  if (!title && !content) {
    return NextResponse.json({ error: "标题和内容不能为都为空" }, { status: 400 });
  }

  // 验证归属（verifyOwner 返回 null=不存在, "forbidden"=无权, 或 note 对象）
  const ownerCheck = await verifyOwner(id, userId);
  if (!ownerCheck || ownerCheck === "forbidden") {
    const code = !ownerCheck ? 404 : 403;
    return NextResponse.json({ error: !ownerCheck ? "笔记不存在" : "无权操作" }, { status: code });
  }

  const updateData: Record<string, any> = {};
  if (title) updateData.title = title;
  if (content) updateData.content = content;
  if (body.mood !== undefined) updateData.mood = String(body.mood).slice(0, 30);

  const updated = await prisma.moodNote.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// 简单复用：PUT 里 verifyOwner 返回的是 note 对象，这里简化判断
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await context.params;
  const userId = session.user.id as string;

  const note = await prisma.moodNote.findUnique({ where: { id } });
  if (!note) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  if (note.userId !== userId) return NextResponse.json({ error: "无权操作" }, { status: 403 });

  // 同时清理点赞、收藏记录
  await prisma.$transaction([
    prisma.moodNoteLike.deleteMany({ where: { noteId: id } }),
    prisma.moodNoteCollect.deleteMany({ where: { noteId: id } }),
    prisma.moodNote.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}

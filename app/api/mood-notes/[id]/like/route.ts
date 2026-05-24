import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/mood-notes/[id]/like — 点赞（需登录，每人一次）
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再点赞" }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = session.user.id as string;

  // 检查笔记是否存在且公开
  const note = await prisma.moodNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  if (!note.isPublic) {
    return NextResponse.json({ error: "只能点赞公开笔记" }, { status: 400 });
  }

  // 不能给自己点赞
  if (note.userId === userId) {
    return NextResponse.json({ error: "不能给自己的笔记点赞" }, { status: 400 });
  }

  // 检查是否已赞
  const existing = await prisma.moodNoteLike.findUnique({
    where: { noteId_userId: { noteId: id, userId } },
  });

  if (existing) {
    // 已赞 → 取消赞
    await prisma.$transaction([
      prisma.moodNoteLike.delete({ where: { id: existing.id } }),
      prisma.moodNote.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json({ liked: false, likeCount: Math.max(0, note.likeCount - 1) });
  } else {
    // 新增赞
    await prisma.$transaction([
      prisma.moodNoteLike.create({ data: { noteId: id, userId } }),
      prisma.moodNote.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
    ]);
    // TODO: 可在此处添加通知逻辑
    return NextResponse.json({ liked: true, likeCount: note.likeCount + 1 }, { status: 201 });
  }
}

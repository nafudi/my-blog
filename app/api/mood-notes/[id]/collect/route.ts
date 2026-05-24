import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/mood-notes/[id]/collect — 收藏（需登录，每人一次）
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录后再收藏" }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = session.user.id as string;

  // 检查笔记是否存在且公开
  const note = await prisma.moodNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  if (!note.isPublic) {
    return NextResponse.json({ error: "只能收藏公开笔记" }, { status: 400 });
  }

  // 检查是否已收藏
  const existing = await prisma.moodNoteCollect.findUnique({
    where: { noteId_userId: { noteId: id, userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "已经收藏过了" }, { status: 409 });
  }

  // 新增收藏
  const [collect] = await prisma.$transaction([
    prisma.moodNoteCollect.create({ data: { noteId: id, userId } }),
    prisma.moodNote.update({
      where: { id },
      data: { collectCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ collected: true, collectCount: note.collectCount + 1 }, { status: 201 });
}

// DELETE /api/mood-notes/[id]/collect — 取消收藏
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = session.user.id as string;

  const existing = await prisma.moodNoteCollect.findUnique({
    where: { noteId_userId: { noteId: id, userId } },
  });

  if (!existing) {
    return NextResponse.json({ error: "未收藏该笔记" }, { status: 404 });
  }

  const note = await prisma.moodNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.moodNoteCollect.delete({ where: { id: existing.id } }),
    prisma.moodNote.update({
      where: { id },
      data: { collectCount: { decrement: 1 } },
    }),
  ]);

  return NextResponse.json({ collected: false, collectCount: Math.max(0, note.collectCount - 1) });
}

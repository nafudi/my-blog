import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/mood-notes/[id]/toggle-public — 切换公开/私密（需登录+归属权）
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = session.user.id as string;

  // 检查笔记归属
  const note = await prisma.moodNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  if (note.userId !== userId) {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const newPublic = !note.isPublic;

  const updated = await prisma.moodNote.update({
    where: { id },
    data: { isPublic: newPublic },
  });

  return NextResponse.json({
    isPublic: updated.isPublic,
    message: newPublic ? "已分享到平台，所有人可见" : "已取消分享，仅自己可见",
  });
}

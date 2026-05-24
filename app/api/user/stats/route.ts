import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/user/stats — 获取用户统计信息（需登录）
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const [noteCount, publicNoteCount, totalLikes, totalCollects] = await Promise.all([
    prisma.moodNote.count({ where: { userId } }),
    prisma.moodNote.count({ where: { userId, isPublic: true } }),
    // 获得的总点赞数：统计所有笔记被点赞的次数
    prisma.moodNoteLike.count({
      where: { note: { userId } },
    }),
    // 被收藏的总数
    prisma.moodNoteCollect.count({
      where: { note: { userId } },
    }),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return NextResponse.json({
    user,
    stats: {
      noteCount,
      publicNoteCount,
      likeCount: totalLikes,
      collectCount: totalCollects,
    },
  });
}

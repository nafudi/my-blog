import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/mood-notes/pref — 设置作者偏好（屏蔽/优先）
// Body: { targetUserId: string, action: "block" | "priority" }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const body = await req.json();
  const { targetUserId, action } = body;

  if (!targetUserId || !["block", "priority"].includes(action)) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  // 不能对自己操作
  if (targetUserId === userId) {
    return NextResponse.json({ error: "不能对自己设置偏好" }, { status: 400 });
  }

  // 检查目标用户是否存在
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
  }

  // 切换：已有则删除，没有则创建
  const existing = await prisma.moodNoteUserPref.findUnique({
    where: { userId_targetUserId_action: { userId, targetUserId, action } },
  });

  if (existing) {
    await prisma.moodNoteUserPref.delete({ where: { id: existing.id } });
    return NextResponse.json({ action: null, message: `已取消${action === "block" ? "屏蔽" : "优先"}` });
  }

  await prisma.moodNoteUserPref.create({
    data: { userId, targetUserId, action },
  });

  return NextResponse.json(
    { action, message: action === "block" ? "已屏蔽该作者的笔记" : "已将该作者置顶优先" },
    { status: 201 }
  );
}

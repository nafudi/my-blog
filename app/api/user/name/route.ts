import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT /api/user/name — 修改昵称（需登录）
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const body = await req.json();
  const name = String(body.name || "").trim().slice(0, 8);

  if (name.length < 1 || name.length > 8) {
    return NextResponse.json({ error: "昵称长度为1-8个字符" }, { status: 400 });
  }

  // 简单过滤：不允许特殊控制字符
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(name)) {
    return NextResponse.json({ error: "昵称包含非法字符" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, name: true },
  });

  return NextResponse.json(user);
}

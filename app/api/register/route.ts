import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/auth";

/**
 * 生成用户ID：注册日期(YYYYMMDD) + 当日5位序号
 * 示例：2025年11月12日第2个用户 → 2025111200002
 */
async function generateUserId(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const existing = await prisma.user.findMany({
    where: { id: { startsWith: today } },
    select: { id: true },
  });

  const nextSeq = existing.length + 1;
  return `${today}${String(nextSeq).padStart(5, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 10);
    const userId = await generateUserId();

    // 创建用户（含初始积分20）
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash,
        passwordPlain: password,
        credits: 50,
      },
    });

    // 写入积分流水
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: 50,
        balance: 50,
        type: "initial",
        description: "新用户注册赠送 50 积分",
      },
    });

    return NextResponse.json({ ok: true, userId });
  } catch (err) {
    console.error("注册失败:", err);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

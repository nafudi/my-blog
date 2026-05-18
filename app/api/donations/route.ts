import { NextRequest, NextResponse } from "next/server";
import auth from "@/lib/auth-server";
import { prisma } from "@/lib/auth";

// POST: 创建打赏记录（需要登录）
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { postSlug, amount, message, payMethod } = await req.json();

    if (!amount || amount < 100) {
      return NextResponse.json(
        { error: "打赏金额至少 1 元" },
        { status: 400 }
      );
    }

    if (amount > 1000000) {
      return NextResponse.json(
        { error: "单次打赏金额不能超过 10,000 元" },
        { status: 400 }
      );
    }

    const donation = await prisma.donation.create({
      data: {
        postSlug,
        userId: session.user.id!,
        amount,
        message: message?.trim() || null,
        payMethod: payMethod || null,
        status: "pending",
      },
    });

    // ====== 支付接口预留区域 ======
    // 后期接入支付宝商户时在此处添加支付 SDK 调用
    // 同时需新增 /api/donations/callback 路由处理回调
    // ====== 预留区域结束 ======

    return NextResponse.json(donation);
  } catch (err) {
    console.error("创建打赏记录失败:", err);
    return NextResponse.json(
      { error: "服务器错误，请稍后重试" },
      { status: 500 }
    );
  }
}

// GET: 获取文章的打赏记录（公开）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postSlug = searchParams.get("postSlug");

  const where = postSlug ? { postSlug } : {};

  const donations = await prisma.donation.findMany({
    where: { ...where, status: "paid" },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: { paidAt: "desc" },
    take: 50,
  });

  return NextResponse.json(donations);
}

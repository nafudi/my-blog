import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id as string;

    const body = await req.json();
    const code = (body.code || "").trim().toUpperCase();

    if (!code || code.length < 6) {
      return NextResponse.json({ error: "请输入有效的兑换码" }, { status: 400 });
    }

    // 查找兑换码
    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code },
    });

    if (!redemptionCode) {
      return NextResponse.json({ error: "兑换码不存在" }, { status: 404 });
    }

    if (redemptionCode.status === "used") {
      return NextResponse.json({ error: "该兑换码已被使用" }, { status: 409 });
    }

    // 事务：标记已用 + 加积分 + 写流水
    const result = await prisma.$transaction(async (tx) => {
      await tx.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: {
          status: "used",
          userId: userId,
          redeemedAt: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: redemptionCode.credits } },
        select: { id: true, credits: true, email: true, name: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId: userId,
          amount: redemptionCode.credits,
          balance: updatedUser.credits,
          type: "redeem",
          description: "兑换码兑换 +" + redemptionCode.credits + " 积分",
          relatedId: String(redemptionCode.id),
        },
      });

      return { user: updatedUser, credits: redemptionCode.credits };
    });

    console.log(
      "[Redeem] user=" + session.user.email + " code=" + code + "+" + result.credits
    );

    return NextResponse.json({
      ok: true,
      message: "兑换成功！获得 " + result.credits + " 积分",
      newBalance: result.user.credits,
      creditsEarned: result.credits,
    });
  } catch (err) {
    console.error("[Redeem] error:", err);
    return NextResponse.json({ error: "兑换失败，请稍后重试" }, { status: 500 });
  }
}

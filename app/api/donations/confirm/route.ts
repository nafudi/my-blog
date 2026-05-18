import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;
    const { amount } = (await req.json()) as { amount?: number };

    const fen = Number(amount);
    if (!fen || fen < 100 || fen > 50000) {
      return NextResponse.json(
        { error: "金额无效（100-50000分）" },
        { status: 400 }
      );
    }

    const yuan = Math.floor(fen / 100);
    const addedCredits = yuan * 2;

    const result = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          userId,
          amount: fen,
          status: "paid",
          payMethod: "alipay",
          message: "充值 " + yuan + " 元",
        },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: addedCredits } },
        select: { id: true, credits: true },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: addedCredits,
          balance: user.credits,
          type: "purchase",
          description: "充值 " + yuan + " 元，获得 " + addedCredits + " 积分",
          relatedId: donation.id,
        },
      });

      return { donation, user };
    });

    return NextResponse.json({
      ok: true,
      addedCredits,
      newBalance: result.user.credits,
      donationId: result.donation.id,
    });
  } catch (err) {
    console.error("[Donation Confirm] error:", err);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}

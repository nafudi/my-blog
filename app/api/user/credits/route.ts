import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      balance: user?.credits ?? 0,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        balance: t.balance,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Credits API] error:", err);
    return NextResponse.json(
      { error: "查询失败" },
      { status: 500 }
    );
  }
}

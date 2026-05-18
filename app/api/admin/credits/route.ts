import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";

// 管理员白名单
const ADMIN_EMAILS = ["841428951@qq.com"];

// POST: 手动给用户添加积分
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { userId, amount, reason } = (await req.json()) as {
      userId?: string;
      amount?: number;
      reason?: string;
    };

    const adminUserId = session!.user!.id;
    const adminUserEmail = session!.user!.email;

    if (!userId || typeof amount !== "number" || amount === 0 || Math.abs(amount) > 10000) {
      return NextResponse.json(
        { error: "参数无效（amount: -10000~10000，不可为0）" },
        { status: 400 }
      );
    }

    // 检查目标用户存在
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, credits: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 事务：加积分 + 写流水
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { credits: { increment: amount } },
        select: { id: true, credits: true },
      });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          balance: updatedUser.credits,
          type: "admin",
          description: reason || ("管理员" + (amount > 0 ? "发放" : "扣减") + " " + Math.abs(amount) + " 积分"),
          relatedId: adminUserId,
        },
      });
      return updatedUser;
    });

    console.log(
      "[Admin Credits] admin=" + session.user.email + " " + (amount > 0 ? "added" : "deducted") + " " + Math.abs(amount) + " to user=" + userId + " newBalance=" + result.credits
    );

    return NextResponse.json({
      ok: true,
      newBalance: result.credits,
      user: { id: targetUser.id, email: targetUser.email, name: targetUser.name },
    });
  } catch (err) {
    console.error("[Admin Credits] error:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

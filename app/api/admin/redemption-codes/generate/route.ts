import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/auth";

const ADMIN_EMAILS = ["841428951@qq.com"];

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#\$%";

function generateCode(): string {
  let s = "";
  for (let i = 0; i < 12; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const count = Number(body.count) || 0;
    const credits = Number(body.credits) || 0;

    if (count < 1 || count > 1000) {
      return NextResponse.json({ error: "数量需在 1~1000 之间" }, { status: 400 });
    }
    if (credits < 1 || credits > 10000) {
      return NextResponse.json({ error: "积分需在 1~10000 之间" }, { status: 400 });
    }

    const generated: string[] = [];
    let collisions = 0;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts < 10) {
        const code = generateCode();
        try {
          await prisma.redemptionCode.create({
            data: { code, credits, status: "active" },
          });
          generated.push(code);
          break;
        } catch (err: any) {
          if (err?.code === "P2002") {
            collisions++;
            attempts++;
            continue;
          }
          throw err;
        }
      }
    }

    console.log(
      "[GenCodes] admin=" + session.user.email +
      " generated=" + generated.length +
      " collisions=" + collisions +
      " credits=" + credits
    );

    return NextResponse.json({
      ok: true,
      generated: generated.length,
      totalRequested: count,
      creditsPerCode: credits,
      preview: generated.slice(0, 20),
    });
  } catch (err) {
    console.error("[GenCodes] error:", err);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

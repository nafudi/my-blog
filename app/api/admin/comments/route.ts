import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import auth from "@/lib/auth-server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const comments = await prisma.comment.findMany({
    include: { author: { select: { name: true, email: true } }, post: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(comments);
}

// PUT: 审核评论（发布/通过）
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, action } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (action === "approve") {
      const updated = await prisma.comment.update({
        where: { id },
        data: { status: "approved" },
      });
      return NextResponse.json({ ok: true, comment: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("审核评论失败:", err);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

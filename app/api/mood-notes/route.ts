import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 简单XSS过滤
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const notes = await prisma.moodNote.findMany({
    where: { userId: session.user.id as string },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json();
  const title = String(body.title || "").trim().slice(0, 200);
  const content = sanitizeHtml(String(body.content || "")).slice(0, 50000);

  if (!title || !content) {
    return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
  }

  const note = await prisma.moodNote.create({
    data: {
      userId: session.user.id as string,
      title,
      content,
      mood: String(body.mood || "").slice(0, 30),
      isPublic: Boolean(body.isPublic),
    },
  });

  return NextResponse.json(note, { status: 201 });
}

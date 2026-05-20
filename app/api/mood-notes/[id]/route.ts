import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "");
}

async function verifyOwner(session: any, noteId: string) {
  const note = await prisma.moodNote.findUnique({ where: { id: noteId } });
  if (!note) return null;
  if (note.userId !== session.user.id) return "forbidden";
  return note;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await context.params;
  const result = await verifyOwner(session, id);
  if (!result) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "无权访问" }, { status: 403 });
  return NextResponse.json(result);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await context.params;
  const result = await verifyOwner(session, id);
  if (!result) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "无权访问" }, { status: 403 });

  const body = await req.json();
  const updateData: Record<string, any> = {};
  if (body.title !== undefined) updateData.title = String(body.title).trim().slice(0, 200);
  if (body.content !== undefined) updateData.content = sanitizeHtml(String(body.content)).slice(0, 50000);
  if (body.mood !== undefined) updateData.mood = String(body.mood).slice(0, 30);
  if (body.isPublic !== undefined) updateData.isPublic = Boolean(body.isPublic);

  const updated = await prisma.moodNote.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await context.params;
  const result = await verifyOwner(session, id);
  if (!result) return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  if (result === "forbidden") return NextResponse.json({ error: "无权访问" }, { status: 403 });

  await prisma.moodNote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

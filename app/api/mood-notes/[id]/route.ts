import { auth } from "@/lib/auth-server"
import { prisma } from "@/lib/auth"
import { NextResponse } from "next/server"

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
}

async function verifyOwner(session: any, id: string) {
  const note = await prisma.moodNote.findFirst({
    where: { id, userId: session.user.id! }
  })
  return note
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const note = await verifyOwner(session, id)

  if (!note) {
    return NextResponse.json({ error: "笔记不存在或无权限" }, { status: 404 })
  }

  return NextResponse.json(note)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const existing = await verifyOwner(session, id)
  if (!existing) {
    return NextResponse.json({ error: "笔记不存在或无权限" }, { status: 404 })
  }

  const body = await request.json()
  const { title, content, mood } = body as { title?: string; content?: string; mood?: string }

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "标题过长" }, { status: 400 })
  }
  if (!content || !content.trim() || content.trim() === "<br>") {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 })
  }
  if (content.length > 50000) {
    return NextResponse.json({ error: "内容过长" }, { status: 400 })
  }

  const note = await prisma.moodNote.update({
    where: { id },
    data: {
      title: title.trim(),
      content: sanitizeHtml(content),
      mood: mood !== undefined ? (mood || null) : undefined
    }
  })

  return NextResponse.json(note)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { id } = await params
  const existing = await verifyOwner(session, id)
  if (!existing) {
    return NextResponse.json({ error: "笔记不存在或无权限" }, { status: 404 })
  }

  await prisma.moodNote.delete({ where: { id } })

  return NextResponse.json({ message: "删除成功" })
}

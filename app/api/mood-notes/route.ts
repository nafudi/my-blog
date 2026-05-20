import { auth } from "@/lib/auth-server"
import { prisma } from "@/lib/auth"
import { NextResponse } from "next/server"

// HTML whitelist - strip dangerous tags for XSS prevention
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const notes = await prisma.moodNote.findMany({
    where: { userId: session.user.id! },
    orderBy: { updatedAt: "desc" }
  })

  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
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

  const note = await prisma.moodNote.create({
    data: {
      userId: session.user.id!,
      title: title.trim(),
      content: sanitizeHtml(content),
      mood: mood || null
    }
  })

  return NextResponse.json(note, { status: 201 })
}

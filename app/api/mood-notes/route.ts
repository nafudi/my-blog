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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope");
  const collect = url.searchParams.get("collect");

  // ========== 公开浏览（不需登录）==========
  if (scope === "public") {
    const session = await auth();
    const currentUserId = session?.user?.id ? (session.user.id as string) : null;

    // 获取用户偏好
    let blockedIds: string[] = [];
    let priorityIds: string[] = [];
    if (currentUserId) {
      const prefs = await prisma.moodNoteUserPref.findMany({
        where: { userId: currentUserId },
        select: { targetUserId: true, action: true },
      });
      blockedIds = prefs.filter((p) => p.action === "block").map((p) => p.targetUserId);
      priorityIds = prefs.filter((p) => p.action === "priority").map((p) => p.targetUserId);
    }

    // 查询公开笔记，附带作者名和点赞/收藏数
    const notes = await prisma.moodNote.findMany({
      where: {
        isPublic: true,
        ...(blockedIds.length > 0 && { userId: { notIn: blockedIds } }),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true, collects: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 排序：优先作者的排前面
    if (priorityIds.length > 0) {
      notes.sort((a, b) => {
        const aPriority = priorityIds.includes(a.userId) ? 1 : 0;
        const bPriority = priorityIds.includes(b.userId) ? 1 : 0;
        return bPriority - aPriority;
      });
    }

    // 构造返回数据（含当前用户的点赞/收藏状态）
    const result = notes.map((note) => ({
      ...note,
      likeCount: note._count.likes,
      collectCount: note._count.collects,
      authorName: note.user.name || "匿名",
      isLiked: false,
      isCollected: false,
    }));

    // 如果已登录，查询当前用户的点赞/收藏状态
    if (currentUserId) {
      const noteIds = result.map((n) => n.id);
      const [likedNotes, collectedNotes] = await Promise.all([
        prisma.moodNoteLike.findMany({
          where: { userId: currentUserId, noteId: { in: noteIds } },
          select: { noteId: true },
        }),
        prisma.moodNoteCollect.findMany({
          where: { userId: currentUserId, noteId: { in: noteIds } },
          select: { noteId: true },
        }),
      ]);
      const likedSet = new Set(likedNotes.map((l) => l.noteId));
      const collectedSet = new Set(collectedNotes.map((c) => c.noteId));
      result.forEach((note) => {
        note.isLiked = likedSet.has(note.id);
        note.isCollected = collectedSet.has(note.id);
      });
    }

    return NextResponse.json(result);
  }

  // ========== 我的收藏（需登录）==========
  if (collect === "mine") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const collections = await prisma.moodNoteCollect.findMany({
      where: { userId: session.user.id as string },
      include: {
        note: {
          include: {
            user: { select: { id: true, name: true } },
            _count: { select: { likes: true, collects: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = collections
      .filter((c) => c.note !== null)
      .map((c) => ({
        ...c.note,
        collectedAt: c.createdAt,
        authorName: c.note!.user.name || "匿名",
        likeCount: c.note!._count.likes,
        collectCount: c.note!._count.collects,
        isCollected: true,
        isLiked: false,
      }));

    return NextResponse.json(result);
  }

  // ========== 默认：我的笔记（需登录）==========
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

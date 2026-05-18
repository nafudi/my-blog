import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import auth from "@/lib/auth-server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const donations = await prisma.donation.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(donations);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminEmails = ["841428951@qq.com"];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.donation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

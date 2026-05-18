import { NextResponse } from 'next/server';

const activeSessions = new Map<string, number>();
const TIMEOUT_MS = 90_000;

function cleanup() {
  const now = Date.now();
  for (const [sid, ts] of activeSessions) {
    if (now - ts > TIMEOUT_MS) activeSessions.delete(sid);
  }
}

export async function POST(request: Request) {
  cleanup();
  try {
    const body = await request.json().catch(() => ({}));
    const sid = (body.sid || '') as string;
    if (sid) {
      activeSessions.set(sid, Date.now());
    }
  } catch {}
  return NextResponse.json({ ok: true, online: activeSessions.size });
}

export async function GET() {
  cleanup();
  return NextResponse.json({ online: activeSessions.size });
}



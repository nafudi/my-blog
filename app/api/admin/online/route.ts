import { NextResponse } from 'next/server';
import auth from '@/lib/auth-server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const adminEmails = ['841428951@qq.com'];
  if (!adminEmails.includes(session.user.email)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Same process - call heartbeat's GET endpoint internally
  // Use direct Map access since we're in the same process
  try {
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
    const res = await fetch(`${baseUrl}/api/heartbeat`);
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Fallback if internal fetch fails (e.g. during build)
  }

  return NextResponse.json({ online: 0 });
}

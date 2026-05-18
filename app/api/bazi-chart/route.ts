import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveBaziChart, getLatestChart } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: 保存一次排盘记录，返回绑定的 conversationId
export async function POST(req: Request) {
  try {
    // 1. 认证
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. 解析请求体
    let body: {
      gender?: string;
      calendarType?: string;
      birthYear?: number;
      birthMonth?: number;
      birthDay?: number;
      birthHour?: number;
      mode?: number;
      baziData?: object;
      dayunData?: object | null;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
    }

    // 3. 校验必填字段
    if (
      !body.gender || !body.calendarType ||
      body.birthYear == null || body.birthMonth == null || body.birthDay == null ||
      !body.baziData
    ) {
      return NextResponse.json(
        { error: '缺少必填字段：gender, calendarType, birthYear, birthMonth, birthDay, baziData' },
        { status: 400 },
      );
    }

    // 4. 保存排盘 + 创建对话
    const conversationId = await saveBaziChart(userId, {
      gender: body.gender,
      calendarType: body.calendarType,
      birthYear: body.birthYear,
      birthMonth: body.birthMonth,
      birthDay: body.birthDay,
      birthHour: body.birthHour ?? 0,
      mode: body.mode ?? 1,
      baziData: body.baziData,
      dayunData: body.dayunData ?? null,
    });

    console.log(`[BaziChart] saved userId=${userId} convId=${conversationId}`);

    return NextResponse.json({ success: true, conversationId });
  } catch (err: any) {
    console.error('[BaziChart] error:', err);
    return NextResponse.json({ error: err.message || '保存失败' }, { status: 500 });
  }
}

// GET: 获取用户最近一次排盘记录（用于页面恢复）
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const chart = await getLatestChart(session.user.id);
    if (!chart) {
      return NextResponse.json({ chart: null });
    }

    return NextResponse.json({
      chart: {
        ...chart,
        bazi_data: typeof chart.bazi_data === 'string' ? JSON.parse(chart.bazi_data) : chart.bazi_data,
        dayun_data: chart.dayun_data ? (typeof chart.dayun_data === 'string' ? JSON.parse(chart.dayun_data) : chart.dayun_data) : null,
      },
    });
  } catch (err: any) {
    console.error('[BaziChart GET] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

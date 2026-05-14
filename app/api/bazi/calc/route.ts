/**
 * 八字排盘计算 API
 * POST /api/bazi/calc
 *
 * Body:
 *   gender: 'male' | 'female'
 *   calendarType: 'solar' | 'lunar'（默认 solar）
 *   name?: string（可选，仅记录用）
 *   birthYear: number
 *   birthMonth: number
 *   birthDay: number
 *   birthHour: number
 *   birthMinute?: number（默认 0）
 *   city?: string（出生城市，用于真太阳时）
 *   useTrueSolarTime?: boolean（是否启用真太阳时修正）
 *
 * Response: { bazi, baziText, dayun, actualSolar?, trueSolarOffset? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { calcBazi, type BaziCalcInput } from '@/lib/mingai/bazi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      gender,
      calendarType = 'solar',
      name,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute = 0,
      city,
      useTrueSolarTime = false,
    } = body;

    // 参数校验
    if (!gender || birthYear == null || birthMonth == null || birthDay == null || birthHour == null) {
      return NextResponse.json(
        { error: '缺少必要参数：gender, birthYear, birthMonth, birthDay, birthHour' },
        { status: 400 }
      );
    }

    if (gender !== 'male' && gender !== 'female') {
      return NextResponse.json(
        { error: 'gender 必须是 male 或 female' },
        { status: 400 }
      );
    }

    if (birthHour < 0 || birthHour > 23) {
      return NextResponse.json(
        { error: 'birthHour 必须在 0-23 之间' },
        { status: 400 }
      );
    }

    if (birthMinute < 0 || birthMinute > 59) {
      return NextResponse.json(
        { error: 'birthMinute 必须在 0-59 之间' },
        { status: 400 }
      );
    }

    const input: BaziCalcInput = {
      gender,
      calendarType,
      birthYear: Number(birthYear),
      birthMonth: Number(birthMonth),
      birthDay: Number(birthDay),
      birthHour: Number(birthHour),
      birthMinute: Number(birthMinute),
      city,
      useTrueSolarTime: Boolean(useTrueSolarTime),
    };

    const result = calcBazi(input);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[API /api/bazi/calc] Error:', err);
    return NextResponse.json(
      { error: err.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 八字排盘计算 API
 * POST /api/bazi/calc
 *
 * Body:
 *   gender: 'male' | 'female'
 *   birthYear: number
 *   birthMonth: number
 *   birthDay: number
 *   birthHour: number
 *   timezone?: string  (default: 'Asia/Shanghai')
 *
 * Response: { bazi, baziText, dayun }
 */
import { NextRequest, NextResponse } from 'next/server';
import { calcBazi, type BaziCalcInput } from '@/lib/mingai/bazi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
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

    const input: BaziCalcInput = {
      gender,
      birthYear: Number(birthYear),
      birthMonth: Number(birthMonth),
      birthDay: Number(birthDay),
      birthHour: Number(birthHour),
    };

    const result = calcBazi(input);

    return NextResponse.json(result);  } catch (err: any) {
    console.error('[API /api/bazi/calc] Error:', err);
    return NextResponse.json(
      { error: err.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}

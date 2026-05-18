import { NextResponse } from 'next/server';
import {
  calculateBaziDayun,
  toBaziDayunJson,
} from '@mingai/core/bazi-dayun';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      gender = 'male',
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
    } = body;

    if (!birthYear || !birthMonth || !birthDay || birthHour === undefined) {
      return NextResponse.json(
        { error: '缺少必要参数：birthYear, birthMonth, birthDay, birthHour' },
        { status: 400 }
      );
    }

    // 直接调用 @mingai/core，获取完整的大运数据
    const dayunResult = calculateBaziDayun({
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
    });

    // 返回完整对象（含 liunianList、naYin、diShi、shenSha、branchRelations 等）
    const fullData = {
      startAge: dayunResult.startAge,
      startAgeDetail: dayunResult.startAgeDetail,
      xiaoYun: dayunResult.xiaoYun || {},
      list: dayunResult.list || [],
      // 同时提供简化版 JSON（兼容旧逻辑）
      simplifiedJson: toBaziDayunJson(dayunResult),
    };

    return NextResponse.json(fullData);
  } catch (err: any) {
    console.error('[bazi-dayun] error:', err.message);
    return NextResponse.json(
      { error: err.message || '计算失败' },
      { status: 500 }
    );
  }
}

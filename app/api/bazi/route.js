import { calculateBazi, calculateBaziShenShaData } from '@mingai/core';
import { toBaziJson } from '@mingai/core';

export async function POST(request) {
  try {
    const body = await request.json();
    const { year, month, day, hour, minute = 0, gender = 1 } = body;

    if (!year || !month || !day || hour === undefined) {
      return Response.json({ error: '缺少必要参数：year, month, day, hour' }, { status: 400 });
    }

    // 八字排盘
    const baziResult = calculateBazi({ year, month, day, hour, minute, gender });
    
    // 神煞计算
    const shenShaResult = calculateBaziShenShaData(baziResult);

    // 合并结果
    const fullResult = {
      ...baziResult,
      shenSha: shenShaResult,
    };

    return Response.json(fullResult);
  } catch (error) {
    console.error('Bazi API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 也支持 GET（用 query string）
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year'));
  const month = parseInt(searchParams.get('month'));
  const day = parseInt(searchParams.get('day'));
  const hour = parseInt(searchParams.get('hour'));
  const minute = parseInt(searchParams.get('minute') || '0');
  const gender = parseInt(searchParams.get('gender') || '1');

  if (!year || !month || !day || isNaN(hour)) {
    return Response.json({ error: 'Missing required params: year, month, day, hour' }, { status: 400 });
  }

  try {
    const baziResult = calculateBazi({ year, month, day, hour, minute, gender });
    const shenShaResult = calculateBaziShenShaData(baziResult);
    const fullResult = { ...baziResult, shenSha: shenShaResult };
    return Response.json(fullResult);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

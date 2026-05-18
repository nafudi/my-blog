/**
 * 八字计算封装
 * 调用 @mingai/core 进行八字排盘和大运计算
 * 支持公历/农历输入，支持真太阳时修正
 */

import {
  calculateBazi,
  toBaziJson,
  toBaziText,
} from '@mingai/core/bazi';
import {
  calculateBaziDayun,
  toBaziDayunJson,
} from '@mingai/core/bazi-dayun';
import { lunar2Solar } from 'chinese-lunar-calendar';

/** 中国主要城市经度数据（用于真太阳时计算） */
const CITY_LON: Record<string, number> = {
  "北京": 116.4074,
  "上海": 121.4737,
  "广州": 113.2644,
  "深圳": 114.0579,
  "成都": 104.0665,
  "杭州": 120.1614,
  "武汉": 114.3054,
  "西安": 108.9402,
  "南京": 118.7969,
  "重庆": 106.5049,
  "天津": 117.1900,
  "苏州": 120.5853,
  "郑州": 113.6401,
  "长沙": 112.9838,
  "沈阳": 123.4315,
  "哈尔滨": 126.5358,
  "长春": 125.3235,
  "济南": 117.0009,
  "石家庄": 114.5149,
  "太原": 112.5489,
  "呼和浩特": 111.7519,
  "乌鲁木齐": 87.6177,
  "拉萨": 91.1322,
  "西宁": 101.7782,
  "兰州": 103.8236,
  "银川": 106.2309,
  "昆明": 102.8329,
  "贵阳": 106.7135,
  "南宁": 108.3665,
  "海口": 110.3312,
  "福州": 119.2965,
  "南昌": 115.8921,
  "合肥": 117.2272,
  "台北": 121.5654,
  "香港": 114.1694,
  "澳门": 113.5491,
};

export interface BaziCalcInput {
  gender: 'male' | 'female';
  calendarType: 'solar' | 'lunar';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute?: number;
  city?: string;
  useTrueSolarTime?: boolean;
}

export interface BaziCalcResult {
  bazi: ReturnType<typeof toBaziJson>;
  baziText: string;
  dayun: ReturnType<typeof toBaziDayunJson>;
  /** 实际使用的公历日期时间（修正后） */
  actualSolar?: { year: number; month: number; day: number; hour: number };
  /** 真太阳时修正值（分钟） */
  trueSolarOffset?: number;
}

/**
 * 真太阳时修正值（分钟）
 * 公式：修正值 = (出生经度 - 120) × 4 分钟
 * 120°E 为中国标准时间基准经度
 */
function calcTrueSolarOffset(lon: number): number {
  return (lon - 120) * 4;
}

/**
 * 农历转公历
 * @returns { year, month, day } 公历日期
 */
function convertLunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean = false
): { year: number; month: number; day: number } {
  try {
    const result = lunar2Solar(year, month, day, isLeapMonth);
    return {
      year: result.year,
      month: result.month,
      day: result.day,
    };
  } catch (e) {
    console.error('[convertLunarToSolar] 转换失败:', e);
    // 转换失败时返回原值（假设用户输入的是公历）
    return { year, month: month, day };
  }
}

/**
 * 计算八字排盘 + 大运流年
 * 支持公历/农历输入，支持真太阳时修正
 */
export function calcBazi(input: BaziCalcInput): BaziCalcResult {
  const { gender, calendarType, birthYear, birthMonth, birthDay, birthHour, birthMinute = 0, city, useTrueSolarTime } = input;

  // 1. 农历转公历
  let solarYear = birthYear;
  let solarMonth = birthMonth;
  let solarDay = birthDay;

  if (calendarType === 'lunar') {
    const solar = convertLunarToSolar(birthYear, birthMonth, birthDay, false);
    solarYear = solar.year;
    solarMonth = solar.month;
    solarDay = solar.day;
  }

  // 2. 真太阳时修正
  let adjustedHour = birthHour;
  let adjustedMinute = birthMinute;
  let trueSolarOffset: number | undefined = undefined;

  if (useTrueSolarTime && city && CITY_LON[city] !== undefined) {
    trueSolarOffset = calcTrueSolarOffset(CITY_LON[city]);
    const totalMinutes = birthHour * 60 + birthMinute + trueSolarOffset;
    adjustedHour = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
    adjustedMinute = ((totalMinutes % 60) + 60) % 60;

    // 如果跨日，调整日期
    const dayOffset = Math.floor(totalMinutes / 1440); // 1440 = 24 * 60
    if (dayOffset !== 0) {
      const d = new Date(solarYear, solarMonth - 1, solarDay + dayOffset);
      solarYear = d.getFullYear();
      solarMonth = d.getMonth() + 1;
      solarDay = d.getDate();
    }
  }

  // 3. 调用 @mingai/core 计算八字
  // 注意：@mingai/core 的 calculateBazi 只接受整数小时（0-23）
  // 我们将分钟四舍五入到最近的时辰
  const finalHour = adjustedMinute >= 30 ? (adjustedHour + 1) % 24 : adjustedHour;

  const baziResult = calculateBazi({
    gender,
    birthYear: solarYear,
    birthMonth: solarMonth,
    birthDay: solarDay,
    birthHour: finalHour,
  });

  const dayunResult = calculateBaziDayun({
    gender,
    birthYear: solarYear,
    birthMonth: solarMonth,
    birthDay: solarDay,
    birthHour: finalHour,
  });

  return {
    bazi: toBaziJson(baziResult),
    baziText: toBaziText(baziResult),
    dayun: toBaziDayunJson(dayunResult),
    actualSolar: { year: solarYear, month: solarMonth, day: solarDay, hour: finalHour },
    trueSolarOffset,
  };
}

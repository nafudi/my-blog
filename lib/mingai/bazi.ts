/**
 * 八字计算封装
 * 调用 @mingai/core 进行八字排盘和大运计算
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

export interface BaziCalcInput {
  gender: 'male' | 'female';
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  timezone?: string;
}

export interface BaziCalcResult {
  bazi: ReturnType<typeof toBaziJson>;
  baziText: string;
  dayun: ReturnType<typeof toBaziDayunJson>;
}

/**
 * 计算八字排盘 + 大运流年
 */
export function calcBazi(input: BaziCalcInput): BaziCalcResult {
  const { gender, birthYear, birthMonth, birthDay, birthHour, timezone = 'Asia/Shanghai' } = input;

  const baziResult = calculateBazi({
    gender,
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    timezone,
  });

  const dayunResult = calculateBaziDayun({
    gender,
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    timezone,
  });

  return {
    bazi: toBaziJson(baziResult),
    baziText: toBaziText(baziResult),
    dayun: toBaziDayunJson(dayunResult),
  };
}

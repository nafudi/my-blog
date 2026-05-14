import { NextRequest, NextResponse } from "next/server";

// 时辰对照表：小时 -> 时辰名
const SHICHEN_MAP: Record<string, string> = {
  "23": "子", "0": "子", "1": "子",
  "2": "丑",
  "3": "寅", "4": "寅",
  "5": "卯", "6": "卯",
  "7": "辰", "8": "辰",
  "9": "巳", "10": "巳",
  "11": "午", "12": "午",
  "13": "未", "14": "未",
  "15": "申", "16": "申",
  "17": "酉", "18": "酉",
  "19": "戌", "20": "戌",
  "21": "亥", "22": "亥",
};

interface BaziRequest {
  year: number;
  month: number;
  day: number;
  hour: number;       // 0-23
  gender: 1 | 0;      // 1=男 0=女
  calendarType: "solar" | "lunar";
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: BaziRequest = await req.json();
    const { year, month, day, hour, gender, calendarType, name } = body;

    if (!year || !month || !day || hour === undefined || gender === undefined) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }
    if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
      return NextResponse.json({ error: "日期范围无效" }, { status: 400 });
    }
    if (hour < 0 || hour > 23) {
      return NextResponse.json({ error: "小时范围 0-23" }, { status: 400 });
    }

    const { Solar, Lunar } = require("lunar-javascript");

    let solar: any;
    let lunar: any;

    if (calendarType === "lunar") {
      lunar = Lunar.fromYmd(year, month, day);
      solar = lunar.getSolar();
    } else {
      solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
      lunar = solar.getLunar();
    }

    const bazi = lunar.getEightChar();
    const yun = bazi.getYun(gender);

    // 时辰名
    const shiChen = SHICHEN_MAP[String(hour)] || "子";

    // 起运信息
    const startSolar = yun.getStartSolar();
    const isForward = yun.isForward();

    // 大运列表（跳过第0步空大运）
    const daYunList = yun.getDaYun();
    const daYunResult: Array<{
      index: number;
      ganZhi: string;
      startYear: number;
      endYear: number;
      liuNian: Array<{ year: number; ganZhi: string; age: number }>;
    }> = [];

    for (let i = 1; i < daYunList.length; i++) {
      const dy = daYunList[i];
      const liuNianList = dy.getLiuNian();
      const liuNian = liuNianList
        ? liuNianList.map((ln: any) => ({
            year: ln.getYear(),
            ganZhi: ln.getGanZhi(),
            age: ln.getAge(),
          }))
        : [];
      daYunResult.push({
        index: i,
        ganZhi: dy.getGanZhi(),
        startYear: dy.getStartYear(),
        endYear: dy.getEndYear(),
        liuNian,
      });
    }

    const result = {
      name: name || "",
      gender: gender === 1 ? "男" : "女",
      calendarType,
      inputDate: { year, month, day, hour },
      shiChen,

      solarDate: {
        year: solar.getYear(),
        month: solar.getMonth(),
        day: solar.getDay(),
        weekDay: solar.getWeek(),
      },

      lunarDate: {
        yearInGanZhi: lunar.getYearInGanZhi(),
        monthInChinese: lunar.getMonthInChinese(),
        dayInChinese: lunar.getDayInChinese(),
        year: lunar.getYear(),
        month: lunar.getMonth(),
        day: lunar.getDay(),
      },

      bazi: {
        year: { ganZhi: bazi.getYear(), gan: bazi.getYearGan(), zhi: bazi.getYearZhi() },
        month: { ganZhi: bazi.getMonth(), gan: bazi.getMonthGan(), zhi: bazi.getMonthZhi() },
        day: { ganZhi: bazi.getDay(), gan: bazi.getDayGan(), zhi: bazi.getDayZhi() },
        time: { ganZhi: bazi.getTime(), gan: bazi.getTimeGan(), zhi: bazi.getTimeZhi() },
      },

      hideGan: {
        year: bazi.getYearHideGan(),
        month: bazi.getMonthHideGan(),
        day: bazi.getDayHideGan(),
        time: bazi.getTimeHideGan(),
      },

      naYin: {
        year: bazi.getYearNaYin(),
        month: bazi.getMonthNaYin(),
        day: bazi.getDayNaYin(),
        time: bazi.getTimeNaYin(),
      },

      shiShen: {
        yearGan: bazi.getYearShiShenGan(),
        monthGan: bazi.getMonthShiShenGan(),
        dayGan: bazi.getDayShiShenGan(),
        timeGan: bazi.getTimeShiShenGan(),
        yearZhi: bazi.getYearShiShenZhi(),
        monthZhi: bazi.getMonthShiShenZhi(),
        dayZhi: bazi.getDayShiShenZhi(),
        timeZhi: bazi.getTimeShiShenZhi(),
      },

      wuXing: {
        year: bazi.getYearWuXing(),
        month: bazi.getMonthWuXing(),
        day: bazi.getDayWuXing(),
        time: bazi.getTimeWuXing(),
      },

      xunKong: {
        year: bazi.getYearXunKong(),
        month: bazi.getMonthXunKong(),
        day: bazi.getDayXunKong(),
        time: bazi.getTimeXunKong(),
      },

      extra: {
        taiYuan: { ganZhi: bazi.getTaiYuan(), naYin: bazi.getTaiYuanNaYin() },
        mingGong: { ganZhi: bazi.getMingGong(), naYin: bazi.getMingGongNaYin() },
        shenGong: { ganZhi: bazi.getShenGong(), naYin: bazi.getShenGongNaYin() },
      },

      yun: {
        startAge: yun.getStartYear() + "年" + yun.getStartMonth() + "个月" + yun.getStartDay() + "天",
        startSolarDate: startSolar.getYear() + "-" + startSolar.getMonth() + "-" + startSolar.getDay(),
        isForward,
        daYun: daYunResult,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("八字排盘计算失败:", error);
    return NextResponse.json(
      { error: "排盘计算失败，请检查输入参数" },
      { status: 500 }
    );
  }
}

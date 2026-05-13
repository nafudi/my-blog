"use client";

import { useState, useEffect } from "react";
import { colors, fonts, fontSizes } from "@/lib/theme";

// ============ 常量数据 ============

const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const GAN_YIN = [true, false, true, false, true, false, true, false, true, false];
const GAN_WU_XING = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 木木火火土土金金水水

const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZHI_WU_XING = [4, 2, 0, 0, 2, 2, 1, 2, 3, 3, 2, 4]; // 水土木木土土火土金金土水
const ZHI_SHENG_XIAO = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

const WU_XING = ["木", "火", "土", "金", "水"];
const WU_XING_COLOR = {
  "木": "#4CAF50",
  "火": "#F44336",
  "土": "#FF9800",
  "金": "#9C27B0",
  "水": "#2196F3"
};

// 十神
const SHI_SHEN = ["比", "劫", "食", "伤", "财", "才", "官", "杀", "枭", "印"];

// 地支藏干
const CANG_GAN: Record<string, string[]> = {
  "子": ["癸"],
  "丑": ["己", "癸", "辛"],
  "寅": ["甲", "丙", "戊"],
  "卯": ["乙"],
  "辰": ["戊", "乙", "癸"],
  "巳": ["丙", "庚", "戊"],
  "午": ["丁", "己"],
  "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"],
  "酉": ["辛"],
  "戌": ["戊", "辛", "丁"],
  "亥": ["壬", "甲"],
};

// 节气表
const JIE_QI = [
  { name: "小寒", month: 1, day: 6 },
  { name: "大寒", month: 1, day: 20 },
  { name: "立春", month: 2, day: 4 },
  { name: "雨水", month: 2, day: 19 },
  { name: "惊蛰", month: 3, day: 6 },
  { name: "春分", month: 3, day: 21 },
  { name: "清明", month: 4, day: 5 },
  { name: "谷雨", month: 4, day: 20 },
  { name: "立夏", month: 5, day: 6 },
  { name: "小满", month: 5, day: 21 },
  { name: "芒种", month: 6, day: 6 },
  { name: "夏至", month: 6, day: 21 },
  { name: "小暑", month: 7, day: 7 },
  { name: "大暑", month: 7, day: 23 },
  { name: "立秋", month: 8, day: 8 },
  { name: "处暑", month: 8, day: 23 },
  { name: "白露", month: 9, day: 8 },
  { name: "秋分", month: 9, day: 23 },
  { name: "寒露", month: 10, day: 8 },
  { name: "霜降", month: 10, day: 23 },
  { name: "立冬", month: 11, day: 7 },
  { name: "小雪", month: 11, day: 22 },
  { name: "大雪", month: 12, day: 7 },
  { name: "冬至", month: 12, day: 22 },
];

// 月令地支（正月寅...十二月丑）
const YUE_LING_ZHI = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

// 五虎遁口诀（年干 → 子月天干索引）
const YUE_GAN_START: Record<string, number> = {
  "甲": 2, "己": 2, // 丙
  "乙": 4, "庚": 4, // 戊
  "丙": 6, "辛": 6, // 庚
  "丁": 8, "壬": 8, // 壬
  "戊": 0, "癸": 0, // 甲
};

// 五鼠遁元口诀（日干 → 子时天干索引）
const SHI_GAN_START: Record<string, number> = {
  "甲": 0, "己": 0, // 甲子
  "乙": 2, "庚": 2, // 丙子
  "丙": 4, "辛": 4, // 戊子
  "丁": 6, "壬": 6, // 庚子
  "戊": 8, "癸": 8, // 壬子
};

// ============ 核心算法 ============

function isYangYear(gan: string): boolean {
  return GAN_YIN[TIAN_GAN.indexOf(gan)];
}

// 获取下一个节气的日期
function getNextJieQiDate(year: number, month: number, day: number): { month: number; day: number } {
  const target = new Date(year, month - 1, day);
  for (const jq of JIE_QI) {
    const jqDate = new Date(year, jq.month - 1, jq.day);
    if (jqDate >= target) {
      return { month: jq.month, day: jq.day };
    }
  }
  // 下一年
  return { month: JIE_QI[0].month, day: JIE_QI[0].day };
}

// 获取上一个节气的日期
function getPrevJieQiDate(year: number, month: number, day: number): { month: number; day: number } {
  const target = new Date(year, month - 1, day);
  for (let i = JIE_QI.length - 1; i >= 0; i--) {
    const jq = JIE_QI[i];
    const jqDate = new Date(year, jq.month - 1, jq.day);
    if (jqDate <= target) {
      return { month: jq.month, day: jq.day };
    }
  }
  // 上一年
  return { month: 12, day: 22 };
}

// 计算年柱
function getYearPillar(year: number, month: number, day: number): string {
  // 立春是年柱分界点
  const liChun = JIE_QI.find(j => j.name === "立春")!;
  const isBeforeLiChun = month < liChun.month || (month === liChun.month && day < liChun.day);
  const effectiveYear = isBeforeLiChun ? year - 1 : year;

  // 1984年是甲子年
  const diff = effectiveYear - 1984;
  const index = ((diff % 60) + 60) % 60;
  return TIAN_GAN[index % 10] + DI_ZHI[index % 12];
}

// 计算月柱（使用五虎遁）
function getMonthPillar(year: number, month: number, day: number): string {
  const yearPillar = getYearPillar(year, month, day);
  const yearGan = yearPillar[0];

  // 月令地支（正月寅，二月卯...十二月丑）
  const yueZhi = YUE_LING_ZHI[month - 1];
  const zhiIndex = DI_ZHI.indexOf(yueZhi);

  // 五虎遁：年干决定子月的天干
  const startGanIndex = YUE_GAN_START[yearGan];
  const ganIndex = (startGanIndex + zhiIndex) % 10;

  return TIAN_GAN[ganIndex] + yueZhi;
}

// 计算日柱（使用儒略日，蔡勒公式）
function getDayPillar(year: number, month: number, day: number): string {
  if (month < 3) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = Math.floor(A / 4);
  const C = 2 - A + B;
  const E = Math.floor(365.25 * (year + 4716));
  const F = Math.floor(30.6001 * (month + 1));
  const jd = C + day + E + F - 1524;

  // 1984年4月10日是甲子日（索引0）
  // 这个日期的儒略日是2445705
  const baseJd = 2445705;
  const diffDays = jd - baseJd;
  const index = ((diffDays % 60) + 60) % 60;

  return TIAN_GAN[index % 10] + DI_ZHI[index % 12];
}

// 计算时柱（使用五鼠遁）
function getHourPillar(dayGan: string, hour: number): string {
  // 处理夜子时（23点以后算次日子时）
  const effectiveHour = hour >= 23 ? 0 : hour;
  const zhiIndex = Math.floor(effectiveHour / 2) % 12;

  // 五鼠遁：日干决定子时的天干
  const startGanIndex = SHI_GAN_START[dayGan];
  const ganIndex = (startGanIndex + zhiIndex) % 10;

  return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

// 获取生肖
function getShengXiao(yearPillar: string): string {
  const zhi = yearPillar[1];
  return ZHI_SHENG_XIAO[DI_ZHI.indexOf(zhi)];
}

// 计算十神（以日干为基准）
function getShiShen(targetGan: string, dayGan: string): string {
  const targetIdx = TIAN_GAN.indexOf(targetGan);
  const dayIdx = TIAN_GAN.indexOf(dayGan);

  // 计算生克关系
  // 同我者比劫，我生者食伤，我克者财，克我者官杀，生我者印枭
  let diff = targetIdx - dayIdx;
  if (diff < 0) diff += 10;

  // 十神映射
  // 0:比, 1:劫, 2:食, 3:伤, 4:财, 5:才, 6:官, 7:杀, 8:枭, 9:印
  if (diff === 0) return "比";
  if (diff === 1 || diff === 9) return "劫";
  if (diff === 2) return "食";
  if (diff === 3) return "伤";
  if (diff === 4 || diff === 5) return "财";
  if (diff === 6) return "官";
  if (diff === 7) return "杀";
  if (diff === 8) return "枭";
  return "印";
}

// 获取藏干列表
function getCangGanList(zhi: string): string[] {
  return CANG_GAN[zhi] || [];
}

// 计算五行统计
function getWuXingCount(pillars: { gan: string; zhi: string; cangGan: string[] }[]): Record<string, number> {
  const wuXing: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };

  for (const p of pillars) {
    // 天干五行
    wuXing[WU_XING[GAN_WU_XING[TIAN_GAN.indexOf(p.gan)]]]++;
    // 地支五行
    wuXing[WU_XING[ZHI_WU_XING[DI_ZHI.indexOf(p.zhi)]]]++;
    // 藏干五行
    for (const c of p.cangGan) {
      if (c) wuXing[WU_XING[GAN_WU_XING[TIAN_GAN.indexOf(c)]]]++;
    }
  }

  return wuXing;
}

// 计算大运
function getDaYun(
  monthPillar: string,
  year: number,
  month: number,
  day: number,
  gender: "male" | "female"
): { pillars: string[]; ages: number[] } {
  const monthGan = monthPillar[0];
  const monthZhi = monthPillar[1];
  const ganIndex = TIAN_GAN.indexOf(monthGan);
  const zhiIndex = DI_ZHI.indexOf(monthZhi);

  const yearPillar = getYearPillar(year, month, day);
  const yearGan = yearPillar[0];
  const isYang = isYangYear(yearGan);

  // 阳男阴女顺排，阴男阳女逆排
  const isShun = (isYang && gender === "male") || (!isYang && gender === "female");

  // 计算起运年龄（简化：立春后天数/3）
  const liChun = JIE_QI.find(j => j.name === "立春")!;
  let birthDate = new Date(year, month - 1, day);
  let liChunDate = new Date(year, liChun.month - 1, liChun.day);

  // 如果生日在立春前，下一个立春在次年
  if (birthDate < liChunDate) {
    liChunDate = new Date(year + 1, liChun.month - 1, liChun.day);
  }

  const daysToNextLiChun = Math.ceil((liChunDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const startAge = Math.round(daysToNextLiChun / 3);

  // 生成大运
  const pillars: string[] = [];
  const ages: number[] = [];

  for (let i = 0; i < 8; i++) {
    let ganIdx, zhiIdx;

    if (isShun) {
      ganIdx = (ganIndex + i + 1) % 10;
      zhiIdx = (zhiIndex + i + 1) % 12;
    } else {
      ganIdx = (ganIndex - i - 1 + 10) % 10;
      zhiIdx = (zhiIndex - i - 1 + 12) % 12;
    }

    pillars.push(TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx]);
    ages.push(startAge + i * 10);
  }

  return { pillars, ages };
}

// ============ 命理解析函数 ============

function analyzeMingLi(result: BaziResult): MingLiAnalysis {
  const { year, month, day, hour, dayGan, daYun } = result;

  // 1. 日主旺衰分析
  const dayIdx = TIAN_GAN.indexOf(dayGan);
  const dayWuXing = WU_XING[GAN_WU_XING[dayIdx]];
  const monthZhi = month[1];
  const monthIdx = DI_ZHI.indexOf(monthZhi);

  // 十二长生状态
  const changSheng = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
  const ganChangSheng: Record<string, number[]> = {
    "甲": [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2], // 亥长生
    "乙": [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3], // 午长生
    "丙": [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3], // 寅长生
    "丁": [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4], // 酉长生
    "戊": [4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3], // 寅长生
    "己": [5, 6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4], // 酉长生
    "庚": [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5], // 巳长生
    "辛": [7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6], // 子长生
    "壬": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // 申长生
    "癸": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0], // 卯长生
  };

  const dayStatus = changSheng[ganChangSheng[dayGan][monthIdx]];
  const isWang = ["长生", "沐浴", "冠带", "临官", "帝旺"].includes(dayStatus);
  const isShuai = ["衰", "病", "死", "墓", "绝"].includes(dayStatus);

  // 2. 十神分析
  const yearShiShen = getShiShen(year[0], dayGan);
  const monthShiShen = getShiShen(month[0], dayGan);
  const hourShiShen = getShiShen(hour[0], dayGan);

  // 3. 格局分析
  let geJu = "";
  let geJuDesc = "";

  if (monthShiShen === "官") {
    geJu = "正官格";
    geJuDesc = "为人正直，有贵气，适合从政或管理";
  } else if (monthShiShen === "杀") {
    geJu = "七杀格";
    geJuDesc = "刚强果断，有权威感，需食神制杀或印化杀";
  } else if (monthShiShen === "财") {
    geJu = "财格";
    geJuDesc = "务实勤劳，善于理财，有致富之命";
  } else if (monthShiShen === "印") {
    geJu = "印格";
    geJuDesc = "聪明好学，有文采，适合学术或教育";
  } else if (monthShiShen === "食") {
    geJu = "食神格";
    geJuDesc = "温和厚道，有福气，财运不错";
  } else if (monthShiShen === "伤") {
    geJu = "伤官格";
    geJuDesc = "才华横溢，有创新能力，但易叛逆";
  } else if (monthShiShen === "比") {
    geJu = "比劫格";
    geJuDesc = "独立自主，竞争心强，需靠自身奋斗";
  } else if (monthShiShen === "劫") {
    geJu = "劫财格";
    geJuDesc = "好胜心强，财运起伏大";
  }

  // 5. 调候分析
  let tiaoHou = "";
  const isSummer = [5, 6, 7].includes(month[1] === "寅" ? 1 : month[1] === "卯" ? 2 : month[1] === "辰" ? 3 : month[1] === "巳" ? 4 : month[1] === "午" ? 5 : month[1] === "未" ? 6 : month[1] === "申" ? 7 : month[1] === "酉" ? 8 : month[1] === "戌" ? 9 : month[1] === "亥" ? 10 : month[1] === "子" ? 11 : 12);

  if (GAN_WU_XING[dayIdx] === 0 && (monthIdx === 9 || monthIdx === 10)) { // 甲乙木冬生
    tiaoHou = "木生寒冬，需要火来暖局驱寒";
  } else if (GAN_WU_XING[dayIdx] === 3 && (monthIdx === 0 || monthIdx === 1)) { // 庚辛金冬生
    tiaoHou = "金寒水冷，需要火来取暖，土来生金";
  } else if (GAN_WU_XING[dayIdx] === 1 && (monthIdx === 3 || monthIdx === 4)) { // 丙丁火夏生
    tiaoHou = "火炎土燥，需要水来调候润局";
  }

  // 6. 性格分析
  let personality = "";
  if (dayGan === "甲") personality = "正直仁厚，有领导力，积极进取";
  else if (dayGan === "乙") personality = "温柔细腻，善于变通，富有艺术气质";
  else if (dayGan === "丙") personality = "热情开朗，阳光正直，行动力强";
  else if (dayGan === "丁") personality = "内心热情，外表含蓄，善于思考";
  else if (dayGan === "戊") personality = "稳重厚道，诚实守信，有责任心";
  else if (dayGan === "己") personality = "包容谦让，勤奋务实，适应力强";
  else if (dayGan === "庚") personality = "刚毅果断，正义感强，有魄力";
  else if (dayGan === "辛") personality = "细腻敏感，品味高雅，追求完美";
  else if (dayGan === "壬") personality = "聪明灵活，胸怀宽广，善于交际";
  else if (dayGan === "癸") personality = "柔和内敛，思考深入，有直觉力";

  // 五行平衡分析
  const maxWx = Object.entries(result.wuXing).sort((a, b) => b[1] - a[1])[0];
  const minWx = Object.entries(result.wuXing).sort((a, b) => a[1] - b[1])[0];

  return {
    dayGan,
    dayStatus,
    isWang,
    isShuai,
    yearShiShen,
    monthShiShen,
    hourShiShen,
    geJu,
    geJuDesc,
    maxWuXing: maxWx[0],
    minWuXing: minWx[0],
    tiaoHou,
    personality,
  };
}

// ============ 类型定义 ============

interface BaziResult {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: string;
  location: string;
  year: string;
  month: string;
  day: string;
  hour: string;
  shengXiao: string;
  dayGan: string;
  dayZhi: string;
  dayShiShen: string;
  yearShiShen: string;
  monthShiShen: string;
  hourShiShen: string;
  cangGan: Record<string, string[]>;
  daYun: { pillars: string[]; ages: number[] };
  wuXing: Record<string, number>;
  liuNian: string;
}

interface MingLiAnalysis {
  dayGan: string;
  dayStatus: string;
  isWang: boolean;
  isShuai: boolean;
  yearShiShen: string;
  monthShiShen: string;
  hourShiShen: string;
  geJu: string;
  geJuDesc: string;
  maxWuXing: string;
  minWuXing: string;
  tiaoHou: string;
  personality: string;
}

// ============ React组件 ============

export default function BaziPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "1998-01-22",
    hour: "4",
    minute: "00",
    gender: "male" as "male" | "female",
    location: "",
  });

  const [result, setResult] = useState<BaziResult | null>(null);
  const [analysis, setAnalysis] = useState<MingLiAnalysis | null>(null);

  const calculate = () => {
    const [year, month, day] = formData.birthDate.split("-").map(Number);
    const hour = parseInt(formData.hour);

    const yearPillar = getYearPillar(year, month, day);
    const monthPillar = getMonthPillar(year, month, day);
    const dayPillar = getDayPillar(year, month, day);
    const hourPillar = getHourPillar(dayPillar[0], hour);

    const dayGan = dayPillar[0];
    const dayZhi = dayPillar[1];

    // 计算十神
    const yearShiShen = getShiShen(yearPillar[0], dayGan);
    const monthShiShen = getShiShen(monthPillar[0], dayGan);
    const hourShiShen = getShiShen(hourPillar[0], dayGan);

    // 计算藏干
    const cangGan = {
      year: getCangGanList(yearPillar[1]),
      month: getCangGanList(monthPillar[1]),
      day: getCangGanList(dayPillar[1]),
      hour: getCangGanList(hourPillar[1]),
    };

    // 计算大运
    const daYun = getDaYun(monthPillar, year, month, day, formData.gender);

    // 计算五行统计
    const pillars = [
      { gan: yearPillar[0], zhi: yearPillar[1], cangGan: cangGan.year },
      { gan: monthPillar[0], zhi: monthPillar[1], cangGan: cangGan.month },
      { gan: dayPillar[0], zhi: dayPillar[1], cangGan: cangGan.day },
      { gan: hourPillar[0], zhi: hourPillar[1], cangGan: cangGan.hour },
    ];
    const wuXing = getWuXingCount(pillars);

    // 流年
    const currentYear = new Date().getFullYear();
    const liuNianPillar = getYearPillar(currentYear, 1, 1);

    const baziResult: BaziResult = {
      name: formData.name,
      birthDate: `${year}年${month}月${day}日`,
      birthTime: `${formData.hour}时${formData.minute}分`,
      gender: formData.gender === "male" ? "男" : "女",
      location: formData.location,
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
      shengXiao: getShengXiao(yearPillar),
      dayGan,
      dayZhi,
      dayShiShen: getShiShen(monthPillar[0], dayGan),
      yearShiShen,
      monthShiShen,
      hourShiShen,
      cangGan,
      daYun,
      wuXing,
      liuNian: liuNianPillar,
    };

    setResult(baziResult);
    setAnalysis(analyzeMingLi(baziResult));
    // 保存到 localStorage 供 analysis 页面使用
    if (typeof window !== "undefined") {
      localStorage.setItem("baziResult", JSON.stringify(baziResult));
      localStorage.setItem("baziAnalysis", JSON.stringify(analyzeMingLi(baziResult)));
    }
    setStep(4);
  };

  // 下拉框样式（深色背景）
  const selectStyle = {
    background: "rgba(18, 18, 26, 0.9)",
    border: "1px solid rgba(212, 168, 83, 0.3)",
    color: colors.goldPrimary,
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23D4A853' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 1rem center",
    paddingRight: "2.5rem",
  };

  const inputStyle = {
    background: "rgba(18, 18, 26, 0.9)",
    border: "1px solid rgba(212, 168, 83, 0.3)",
    color: colors.goldPrimary,
    borderRadius: "0.75rem",
    padding: "0.75rem 1rem",
  };

  const labelStyle = {
    color: colors.textSecondary,
    fontSize: fontSizes.bodySm,
    marginBottom: "0.5rem",
  };

  // 时辰地支对应表（组件外部常量）
  const SHICHEN_LIST = [
    { zhi: "子", hour: 0, desc: "23:00-01:00" },
    { zhi: "丑", hour: 2, desc: "01:00-03:00" },
    { zhi: "寅", hour: 4, desc: "03:00-05:00" },
    { zhi: "卯", hour: 6, desc: "05:00-07:00" },
    { zhi: "辰", hour: 8, desc: "07:00-09:00" },
    { zhi: "巳", hour: 10, desc: "09:00-11:00" },
    { zhi: "午", hour: 12, desc: "11:00-13:00" },
    { zhi: "未", hour: 14, desc: "13:00-15:00" },
    { zhi: "申", hour: 16, desc: "15:00-17:00" },
    { zhi: "酉", hour: 18, desc: "17:00-19:00" },
    { zhi: "戌", hour: 20, desc: "19:00-21:00" },
    { zhi: "亥", hour: 22, desc: "21:00-23:00" },
  ];

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: colors.bgPrimary }}>
      <div className="max-w-3xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className={`${fonts.heading} ${fontSizes.hero} glow-text mb-4`}>
            ☯ 八字排盘
          </h1>
          <p style={{ color: colors.textSecondary }}>
            基于传统命理学，解析您的人生密码
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex justify-center gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: step >= s ? colors.goldPrimary : "rgba(212,168,83,0.1)",
                  color: step >= s ? colors.bgPrimary : colors.goldPrimary,
                }}
              >
                {s}
              </div>
              {s < 3 && <div className="w-8 h-px" style={{ background: "rgba(212,168,83,0.2)" }} />}
            </div>
          ))}
        </div>

        {/* 步骤1：基本信息 */}
        {step === 1 && (
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
            <h2 className={`${fonts.heading} ${fontSizes.h3} mb-6`} style={{ color: colors.goldPrimary }}>
              第一步：基本信息
            </h2>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>姓名（称呼）</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入您的称呼"
                  style={inputStyle}
                  className="w-full"
                />
              </div>

              <div>
                <label style={labelStyle}>性别</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, gender: "male" })}
                    className="flex-1 py-3 rounded-lg border transition-all"
                    style={{
                      background: formData.gender === "male" ? "rgba(212,168,83,0.2)" : "transparent",
                      borderColor: formData.gender === "male" ? colors.goldPrimary : "rgba(212,168,83,0.2)",
                      color: formData.gender === "male" ? colors.goldPrimary : colors.textSecondary,
                    }}
                  >
                    ♂ 男
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, gender: "female" })}
                    className="flex-1 py-3 rounded-lg border transition-all"
                    style={{
                      background: formData.gender === "female" ? "rgba(212,168,83,0.2)" : "transparent",
                      borderColor: formData.gender === "female" ? colors.goldPrimary : "rgba(212,168,83,0.2)",
                      color: formData.gender === "female" ? colors.goldPrimary : colors.textSecondary,
                    }}
                  >
                    ♀ 女
                  </button>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name}
                className="w-full py-3 rounded-lg font-medium mt-6"
                style={{
                  background: formData.name ? "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.1))" : "rgba(212,168,83,0.1)",
                  color: formData.name ? colors.goldPrimary : colors.textMuted,
                  border: "1px solid rgba(212,168,83,0.3)",
                }}
              >
                下一步 →
              </button>
            </div>
          </div>
        )}

        {/* 步骤2：出生信息 */}
        {step === 2 && (
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
            <h2 className={`${fonts.heading} ${fontSizes.h3} mb-6`} style={{ color: colors.goldPrimary }}>
              第二步：出生信息
            </h2>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>阳历出生日期</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  style={inputStyle}
                  className="w-full"
                />
              </div>

              <div>
                <label style={labelStyle}>出生时辰（点击选择）</label>
                <div className="grid grid-cols-4 gap-2">
                  {SHICHEN_LIST.map((item) => {
                    const isSelected = parseInt(formData.hour) === item.hour;
                    return (
                      <button
                        key={item.zhi}
                        onClick={() => setFormData({ ...formData, hour: String(item.hour) })}
                        className="py-2 rounded border text-center text-sm transition-all"
                        style={{
                          background: isSelected ? "rgba(212,168,83,0.2)" : "transparent",
                          borderColor: isSelected ? colors.goldPrimary : "rgba(212,168,83,0.15)",
                          color: isSelected ? colors.goldPrimary : colors.textSecondary,
                        }}
                      >
                        {item.zhi}时
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs" style={{ color: colors.textMuted }}>
                  当前：{SHICHEN_LIST.find(s => s.hour === parseInt(formData.hour))?.zhi}时 ({SHICHEN_LIST.find(s => s.hour === parseInt(formData.hour))?.desc})
                </p>
              </div>

              <div>
                <label style={labelStyle}>出生地（省/市）</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="如：广东省深圳市"
                  style={inputStyle}
                  className="w-full"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg border"
                  style={{ borderColor: "rgba(212,168,83,0.2)", color: colors.textSecondary }}
                >
                  ← 返回
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.birthYear || !formData.birthMonth || !formData.birthDay}
                  className="flex-1 py-3 rounded-lg font-medium"
                  style={{
                    background: (formData.birthYear && formData.birthMonth && formData.birthDay) ? "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.1))" : "rgba(212,168,83,0.1)",
                    color: (formData.birthYear && formData.birthMonth && formData.birthDay) ? colors.goldPrimary : colors.textMuted,
                    border: "1px solid rgba(212,168,83,0.3)",
                  }}
                >
                  下一步 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 步骤3：确认信息 */}
        {step === 3 && (
          <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
            <h2 className={`${fonts.heading} ${fontSizes.h3} mb-6`} style={{ color: colors.goldPrimary }}>
              第三步：确认信息
            </h2>

            <div className="space-y-3" style={{ color: colors.textSecondary }}>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                <span>称呼</span>
                <span style={{ color: colors.goldPrimary }}>{formData.name}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                <span>性别</span>
                <span style={{ color: colors.goldPrimary }}>{formData.gender === "male" ? "男" : "女"}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                <span>阳历出生</span>
                <span style={{ color: colors.goldPrimary }}>{formData.birthDate || "未填写"}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                <span>出生时辰</span>
                <span style={{ color: colors.goldPrimary }}>{SHICHEN_LIST.find(s => s.hour === parseInt(formData.hour))?.zhi}时</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                <span>出生地</span>
                <span style={{ color: colors.goldPrimary }}>{formData.location || "未填写"}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-lg border"
                style={{ borderColor: "rgba(212,168,83,0.2)", color: colors.textSecondary }}
              >
                ← 修改
              </button>
              <button
                onClick={calculate}
                className="flex-1 py-3 rounded-lg font-medium"
                style={{
                  background: "linear-gradient(135deg, rgba(212,168,83,0.4), rgba(212,168,83,0.2))",
                  color: colors.goldPrimary,
                  border: "1px solid rgba(212,168,83,0.4)",
                }}
              >
                ☯ 开始排盘
              </button>
            </div>
          </div>
        )}

        {/* 步骤4：结果显示 */}
        {step === 4 && result && analysis && (
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="text-center p-4 rounded-2xl border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h2 className={`${fonts.heading} ${fontSizes.h2}`} style={{ color: colors.goldPrimary }}>
                {result.name} · {result.gender}命
              </h2>
              <p style={{ color: colors.textSecondary }}>
                {result.birthDate} {result.birthTime} · {result.shengXiao}年生 · {result.location}
              </p>
            </div>

            {/* 四柱 */}
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
                四柱八字
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "年柱", value: result.year, desc: result.shengXiao + "年", shiShen: result.yearShiShen },
                  { label: "月柱", value: result.month, desc: "月令", shiShen: result.monthShiShen },
                  { label: "日柱", value: result.day, desc: result.dayShiShen + "元", shiShen: "" },
                  { label: "时柱", value: result.hour, desc: "", shiShen: result.hourShiShen },
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-4 rounded-xl border" style={{ background: "rgba(212,168,83,0.05)", borderColor: "rgba(212,168,83,0.15)" }}>
                    <div className="text-sm mb-2" style={{ color: colors.textMuted }}>{item.label}</div>
                    <div className={`${fonts.heading} text-2xl mb-1`} style={{ color: colors.goldPrimary }}>{item.value}</div>
                    <div className="text-xs" style={{ color: colors.textTertiary }}>{item.desc}</div>
                    {item.shiShen && <div className="text-xs mt-1" style={{ color: "rgba(212,168,83,0.7)" }}>{item.shiShen}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 藏干 */}
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
                地支藏干
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "年支", cang: result.cangGan.year },
                  { label: "月支", cang: result.cangGan.month },
                  { label: "日支", cang: result.cangGan.day },
                  { label: "时支", cang: result.cangGan.hour },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg text-center" style={{ background: "rgba(212,168,83,0.05)" }}>
                    <div className="text-sm mb-1" style={{ color: colors.textMuted }}>{item.label}</div>
                    <div className="font-medium" style={{ color: colors.goldPrimary }}>
                      {item.cang.join(" · ") || "无"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 五行统计 */}
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
                五行分布
              </h3>
              <div className="space-y-2">
                {Object.entries(result.wuXing).map(([key, value]) => {
                  const max = Math.max(...Object.values(result.wuXing));
                  const percent = (value / (max || 1)) * 100;
                  const wxKey = key as keyof typeof WU_XING_COLOR;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-6 text-center font-medium" style={{ color: WU_XING_COLOR[wxKey] }}>{key}</span>
                      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(212,168,83,0.1)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, background: WU_XING_COLOR[wxKey] }}
                        />
                      </div>
                      <span className="w-6 text-center" style={{ color: colors.textSecondary }}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 命理解析 */}
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
                命理解析
              </h3>

              <div className="space-y-4">
                {/* 日主状态 */}
                <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg" style={{ color: colors.goldPrimary }}>{analysis.dayGan}日主</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      analysis.isWang ? "bg-green-900/50 text-green-300" :
                      analysis.isShuai ? "bg-red-900/50 text-red-300" :
                      "bg-yellow-900/50 text-yellow-300"
                    }`}>
                      {analysis.dayStatus}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {analysis.isWang ? "日主得令，精力旺盛" : analysis.isShuai ? "日主失令，需要扶助" : "日主中和，需观大运"}
                  </p>
                </div>

                {/* 格局 */}
                <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg" style={{ color: colors.goldPrimary }}>{analysis.geJu}</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {analysis.geJuDesc}
                  </p>
                </div>

                {/* 性格 */}
                <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                  <div className="mb-2">
                    <span className="text-lg" style={{ color: colors.goldPrimary }}>性格特点</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    {analysis.personality}
                  </p>
                </div>

                {/* 五行建议 */}
                <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                  <div className="mb-2">
                    <span className="text-lg" style={{ color: colors.goldPrimary }}>五行建议</span>
                  </div>
                  <p className="text-sm" style={{ color: colors.textSecondary }}>
                    五行最旺：<span style={{ color: WU_XING_COLOR[analysis.maxWuXing as keyof typeof WU_XING_COLOR] }}>{analysis.maxWuXing}</span>
                    {" "}五行最弱：<span style={{ color: WU_XING_COLOR[analysis.minWuXing as keyof typeof WU_XING_COLOR] }}>{analysis.minWuXing}</span>
                  </p>
                  {analysis.tiaoHou && (
                    <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      调候：{analysis.tiaoHou}
                    </p>
                  )}
                </div>

                {/* 十神关系 */}
                <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                  <div className="mb-2">
                    <span className="text-lg" style={{ color: colors.goldPrimary }}>十神关系</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>年柱：<span style={{ color: colors.goldPrimary }}>{analysis.yearShiShen}</span></div>
                    <div>月柱：<span style={{ color: colors.goldPrimary }}>{analysis.monthShiShen}</span></div>
                    <div>时柱：<span style={{ color: colors.goldPrimary }}>{analysis.hourShiShen}</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 大运 */}
            <div className="rounded-2xl p-6 border" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
                大运走势
              </h3>
              <div className="space-y-2">
                {result.daYun.pillars.map((pillar, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-2 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
                    <span className="w-20 text-sm" style={{ color: colors.textMuted }}>
                      {result.daYun.ages[idx]}-{result.daYun.ages[idx] + 9}岁
                    </span>
                    <span className={`${fonts.heading}`} style={{ color: colors.goldPrimary }}>
                      {pillar}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 流年 */}
            <div className="rounded-2xl p-6 border text-center" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
              <h3 className={`${fonts.heading} ${fontSizes.body} mb-2`} style={{ color: colors.textSecondary }}>
                今年流年
              </h3>
              <p className={`${fonts.heading} ${fontSizes.h2}`} style={{ color: colors.goldPrimary }}>
                {result.liuNian}
              </p>
            </div>

            {/* 命理解析按钮 */}
            <button
              onClick={() => {
                localStorage.setItem("baziResult", JSON.stringify(result));
                localStorage.setItem("baziAnalysis", JSON.stringify(analysis));
                window.location.href = "/bazi/analysis";
              }}
              className="w-full py-3 rounded-lg font-medium"
              style={{
                background: "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.1))",
                color: colors.goldPrimary,
                border: "1px solid rgba(212,168,83,0.3)",
              }}
            >
              🔮 查看详细命理解析
            </button>

            {/* 重新开始 */}
            <button
              onClick={() => { setStep(1); setResult(null); setAnalysis(null); }}
              className="w-full py-3 rounded-lg border"
              style={{ borderColor: "rgba(212,168,83,0.2)", color: colors.textSecondary }}
            >
              ← 重新排盘
            </button>
          </div>
        )}

        {/* 底部说明 */}
        <div className="mt-8 text-center" style={{ color: colors.textMuted }}>
          <p className={fontSizes.caption}>
            ☯ 本工具基于传统命理学算法，结果仅供参考娱乐
          </p>
        </div>
      </div>
    </div>
  );
}

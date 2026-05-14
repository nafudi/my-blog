"use client";

import { useState, useRef, useEffect } from "react";
import { fonts, fontSizes, lineHeights, colors, textStyles, tw } from "@/lib/theme";

interface PillarData {
  stem: string;
  branch: string;
  tenGod?: string;
  hiddenStems: { stem: string; qiType: string; tenGod: string }[];
  naYin?: string;
  diShi?: string;
  shenSha: string[];
  kongWang: { isKong: boolean };
}

interface BaziResult {
  gender: string;
  dayMaster: string;
  kongWang: { xun: string; kongZhi: string[] };
  fourPillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData;
  };
  relations: { type: string; pillars: string[]; description: string }[];
  tianGanChongKe?: { stemA: string; stemB: string; positions: string[] }[];
  taiYuan?: string;
  mingGong?: string;
}

interface DayunItem {
  startYear: number;
  startAge: number;
  ganZhi: string;
  tenGod: string;
  naYin: string;
  diShi: string;
  shenSha: string[];
  liunianList?: { year: number; ganZhi: string; tenGod: string; naYin: string; shenSha: string[] }[];
}

/** 中国主要城市经纬度数据（用于真太阳时计算） */
const CITY_DATA: Record<string, { lon: number; lat: number }> = {
  "北京": { lon: 116.4074, lat: 39.9042 },
  "上海": { lon: 121.4737, lat: 31.2304 },
  "广州": { lon: 113.2644, lat: 23.1291 },
  "深圳": { lon: 114.0579, lat: 22.5431 },
  "成都": { lon: 104.0665, lat: 30.5723 },
  "杭州": { lon: 120.1614, lat: 30.2936 },
  "武汉": { lon: 114.3054, lat: 30.5931 },
  "西安": { lon: 108.9402, lat: 34.3416 },
  "南京": { lon: 118.7969, lat: 32.0603 },
  "重庆": { lon: 106.5049, lat: 29.5332 },
  "天津": { lon: 117.1900, lat: 39.0842 },
  "苏州": { lon: 120.5853, lat: 31.2989 },
  "郑州": { lon: 113.6401, lat: 34.7447 },
  "长沙": { lon: 112.9838, lat: 28.1941 },
  "沈阳": { lon: 123.4315, lat: 41.8057 },
  "哈尔滨": { lon: 126.5358, lat: 45.8022 },
  "长春": { lon: 125.3235, lat: 43.8171 },
  "济南": { lon: 117.0009, lat: 36.6758 },
  "石家庄": { lon: 114.5149, lat: 38.0428 },
  "太原": { lon: 112.5489, lat: 37.8706 },
  "呼和浩特": { lon: 111.7519, lat: 40.8414 },
  "乌鲁木齐": { lon: 87.6177, lat: 43.7928 },
  "拉萨": { lon: 91.1322, lat: 29.6604 },
  "西宁": { lon: 101.7782, lat: 36.6171 },
  "兰州": { lon: 103.8236, lat: 36.0581 },
  "银川": { lon: 106.2309, lat: 38.4872 },
  "昆明": { lon: 102.8329, lat: 24.8801 },
  "贵阳": { lon: 106.7135, lat: 26.5783 },
  "南宁": { lon: 108.3665, lat: 22.8170 },
  "海口": { lon: 110.3312, lat: 20.0319 },
  "福州": { lon: 119.2965, lat: 26.0745 },
  "南昌": { lon: 115.8921, lat: 28.6765 },
  "合肥": { lon: 117.2272, lat: 31.8206 },
  "台北": { lon: 121.5654, lat: 25.0338 },
  "香港": { lon: 114.1694, lat: 22.3193 },
  "澳门": { lon: 113.5491, lat: 22.1987 },
};

const CITY_NAMES = Object.keys(CITY_DATA).sort();

export default function BaziPage() {
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(1998);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(22);
  const [birthHour, setBirthHour] = useState(4);
  const [birthMinute, setBirthMinute] = useState(0);
  const [city, setCity] = useState("");
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);
  const [dayunList, setDayunList] = useState<DayunItem[]>([]);

  // 对话相关
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /** 真太阳时修正（分钟） */
  function calcTrueSolarTimeOffset(lon: number): number {
    // 真太阳时 = 平太阳时 + 时差修正 + (经度 - 120) × 4分钟
    // 简化计算：仅考虑经度差，忽略时差修正（误差在 ±16 分钟内）
    return (lon - 120) * 4;
  }

  async function handleCalc() {
    setLoading(true);
    setError("");
    setBaziResult(null);
    setDayunList([]);
    setChatMessages([]);

    try {
      let calcYear = birthYear;
      let calcMonth = birthMonth;
      let calcDay = birthDay;
      let calcHour = birthHour;
      let calcMinute = birthMinute;

      // 真太阳时修正
      if (useTrueSolarTime && city && CITY_DATA[city]) {
        const offsetMin = calcTrueSolarTimeOffset(CITY_DATA[city].lon);
        const totalMinutes = birthHour * 60 + birthMinute + offsetMin;
        const adjustedHour = Math.floor(totalMinutes / 60);
        const adjustedMinute = totalMinutes % 60;
        calcHour = ((adjustedHour % 24) + 24) % 24;
        calcMinute = Math.floor(adjustedMinute);
        // 如果跨日，调整日期
        const dayOffset = Math.floor(adjustedHour / 24);
        if (dayOffset !== 0) {
          const d = new Date(calcYear, calcMonth - 1, calcDay + dayOffset);
          calcYear = d.getFullYear();
          calcMonth = d.getMonth() + 1;
          calcDay = d.getDate();
        }
      }

      const res = await fetch("/api/bazi/calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          calendarType,
          name: name || undefined,
          birthYear: calcYear,
          birthMonth: calcMonth,
          birthDay: calcDay,
          birthHour: calcHour,
          birthMinute: calcMinute,
          city: city || undefined,
          useTrueSolarTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "计算失败");
      setBaziResult(data.bazi);
      setDayunList(data.dayun?.list || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /** 渲染单柱表格 */
  function renderPillar(title: string, p: PillarData) {
    return (
      <div key={title} className="min-w-[220px] flex-1">
        <div className={`${fontSizes.h4} ${tw.goldPrimary} mb-2 text-center`}>{title}</div>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-[rgba(212,168,83,0.15)]">
              <td className={`${textStyles.muted} w-16 py-1`}>天干</td>
              <td className={`${tw.textPrimary} text-center font-bold text-lg`}>{p.stem}</td>
            </tr>
            <tr className="border-b border-[rgba(212,168,83,0.15)]">
              <td className={`${textStyles.muted} py-1`}>地支</td>
              <td className={`${tw.textPrimary} text-center font-bold text-lg`}>{p.branch}</td>
            </tr>
            {p.tenGod && (
              <tr className="border-b border-[rgba(212,168,83,0.15)]">
                <td className={`${textStyles.muted} py-1`}>十神</td>
                <td className={`${tw.goldLight} text-center`}>{p.tenGod}</td>
              </tr>
            )}
            <tr className="border-b border-[rgba(212,168,83,0.15)]">
              <td className={`${textStyles.muted} py-1`}>地势</td>
              <td className={`${tw.textSecondary} text-center`}>{p.diShi || "-"}</td>
            </tr>
            <tr className="border-b border-[rgba(212,168,83,0.15)]">
              <td className={`${textStyles.muted} py-1`}>纳音</td>
              <td className={`${tw.textSecondary} text-center text-xs`}>{p.naYin || "-"}</td>
            </tr>
            <tr>
              <td className={`${textStyles.muted} py-1 align-top`}>藏干</td>
              <td className="py-1">
                {p.hiddenStems.map((h, i) => (
                  <div key={i} className="flex justify-between gap-2 text-xs">
                    <span className={tw.textPrimary}>{h.stem}</span>
                    <span className={tw.goldLight}>{h.tenGod}</span>
                  </div>
                ))}
              </td>
            </tr>
            {p.shenSha.length > 0 && (
              <tr>
                <td className={`${textStyles.muted} py-1 align-top`}>神煞</td>
                <td className="py-1">
                  <div className="flex flex-wrap gap-1">
                    {p.shenSha.map((s, i) => (
                      <span key={i} className={`${fontSizes.caption} px-1.5 py-0.5 rounded bg-[rgba(212,168,83,0.12)] ${tw.goldPrimary}`}>{s}</span>
                    ))}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 标题 */}
      <h1 className={`${fonts.heading} ${fontSizes.h1} ${tw.goldPrimary} text-center mb-2`}>八字排盘</h1>
      <p className={`${textStyles.subtitle} text-center mb-8`}>输入出生信息，获取八字排盘与 AI 解读</p>

      {/* 输入表单 */}
      <div className="bg-[#1a1a2e] rounded-xl p-6 mb-8 border border-[rgba(212,168,83,0.15)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* 公历/农历切换 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>历法</label>
            <select
              value={calendarType}
              onChange={e => setCalendarType(e.target.value as "solar" | "lunar")}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="solar">公历（阳历）</option>
              <option value="lunar">农历（阴历）</option>
            </select>
          </div>

          {/* 性别 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>性别</label>
            <select
              value={gender}
              onChange={e => setGender(e.target.value as "male" | "female")}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>

          {/* 姓名（可选） */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>姓名（可选）</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white placeholder:text-[#555]"
            />
          </div>

          {/* 年 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>年</label>
            <input
              type="number"
              value={birthYear}
              onChange={e => setBirthYear(Number(e.target.value))}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>

          {/* 月 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>月</label>
            <input
              type="number"
              min={1}
              max={calendarType === "lunar" ? 12 : 12}
              value={birthMonth}
              onChange={e => setBirthMonth(Number(e.target.value))}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>

          {/* 日 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>日</label>
            <input
              type="number"
              min={1}
              max={31}
              value={birthDay}
              onChange={e => setBirthDay(Number(e.target.value))}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>

          {/* 时 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>时（0-23）</label>
            <input
              type="number"
              min={0}
              max={23}
              value={birthHour}
              onChange={e => setBirthHour(Number(e.target.value))}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>

          {/* 分 */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>分（0-59）</label>
            <input
              type="number"
              min={0}
              max={59}
              value={birthMinute}
              onChange={e => setBirthMinute(Number(e.target.value))}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>

          {/* 省市（用于真太阳时） */}
          <div>
            <label className={`${fontSizes.bodySm} ${tw.textSecondary} block mb-1`}>出生城市（真太阳时用）</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded px-2 py-1.5 text-sm text-white"
            >
              <option value="">请选择城市</option>
              {CITY_NAMES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 真太阳时开关 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trueSolar"
              checked={useTrueSolarTime}
              onChange={e => setUseTrueSolarTime(e.target.checked)}
              className="accent-[#d4a853]"
            />
            <label htmlFor="trueSolar" className={`${fontSizes.bodySm} ${tw.textSecondary}`}>启用真太阳时修正</label>
          </div>
        </div>

        <button
          onClick={handleCalc}
          disabled={loading}
          className={`w-full py-2.5 rounded-lg ${fonts.body} ${fontSizes.body} font-semibold transition
            ${loading
              ? "bg-[rgba(212,168,83,0.3)] text-[rgba(255,255,255,0.5)] cursor-not-allowed"
              : "bg-[#d4a853] text-[#0a0a0f] hover:bg-[#e8c878]"}`}
        >
          {loading ? "计算中..." : "开始排盘"}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* 排盘结果 */}
      {baziResult && (
        <>
          {/* 基本信息 */}
          <div className="mb-6 text-center">
            <span className={`${fontSizes.bodySm} ${textStyles.muted}`}>
              日主：<span className={tw.goldPrimary}>{baziResult.dayMaster}</span>
              ｜ 空亡：{baziResult.kongWang.xun}（{baziResult.kongWang.kongZhi.join("、")}）
              {baziResult.taiYuan && <> ｜ 胎元：<span className={tw.goldLight}>{baziResult.taiYuan}</span></>}
              {baziResult.mingGong && <> ｜ 命宫：<span className={tw.goldLight}>{baziResult.mingGong}</span></>}
            </span>
          </div>

          {/* 四柱表格 */}
          <div className="bg-[#1a1a2e] rounded-xl p-6 mb-6 border border-[rgba(212,168,83,0.15)]">
            <h2 className={`${fonts.heading} ${fontSizes.h2} ${tw.goldPrimary} mb-4`}>四柱</h2>
            <div className="flex flex-wrap gap-4">
              {renderPillar("年柱", baziResult.fourPillars.year)}
              {renderPillar("月柱", baziResult.fourPillars.month)}
              {renderPillar("日柱", baziResult.fourPillars.day)}
              {renderPillar("时柱", baziResult.fourPillars.hour)}
            </div>

            {/* 地支关系 */}
            {baziResult.relations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[rgba(212,168,83,0.15)]">
                <div className={`${fontSizes.bodySm} ${textStyles.muted} mb-2`}>地支关系</div>
                <div className="flex flex-wrap gap-2">
                  {baziResult.relations.map((r, i) => (
                    <span key={i} className={`${fontSizes.caption} px-2 py-1 rounded bg-[rgba(212,168,83,0.08)] ${tw.textSecondary}`}>
                      {r.description}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 天干冲克 */}
            {baziResult.tianGanChongKe && baziResult.tianGanChongKe.length > 0 && (
              <div className="mt-3">
                <div className={`${fontSizes.bodySm} ${textStyles.muted} mb-2`}>天干冲克</div>
                <div className="flex flex-wrap gap-2">
                  {baziResult.tianGanChongKe.map((c, i) => (
                    <span key={i} className={`${fontSizes.caption} px-2 py-1 rounded bg-red-900/20 ${tw.textSecondary}`}>
                      {c.stemA} 冲 {c.stemB}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 大运 */}
          {dayunList.length > 0 && (
            <div className="bg-[#1a1a2e] rounded-xl p-6 mb-6 border border-[rgba(212,168,83,0.15)]">
              <h2 className={`${fonts.heading} ${fontSizes.h2} ${tw.goldPrimary} mb-4`}>大运</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-[rgba(212,168,83,0.15)]">
                      <th className={`${textStyles.muted} font-medium pb-2`}>起运</th>
                      <th className={`${textStyles.muted} font-medium pb-2`}>干支</th>
                      <th className={`${textStyles.muted} font-medium pb-2`}>十神</th>
                      <th className={`${textStyles.muted} font-medium pb-2`}>纳音</th>
                      <th className={`${textStyles.muted} font-medium pb-2`}>地势</th>
                      <th className={`${textStyles.muted} font-medium pb-2`}>神煞</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayunList.map((d, i) => (
                      <tr key={i} className="border-b border-[rgba(212,168,83,0.08)]">
                        <td className={`${tw.textSecondary} py-2`}>{d.startAge}岁（{d.startYear}）</td>
                        <td className={`${tw.textPrimary} font-bold py-2`}>{d.ganZhi}</td>
                        <td className={`${tw.goldLight} py-2`}>{d.tenGod}</td>
                        <td className={`${tw.textSecondary} text-xs py-2`}>{d.naYin}</td>
                        <td className={`${tw.textSecondary} py-2`}>{d.diShi}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {d.shenSha.map((s, j) => (
                              <span key={j} className={`${fontSizes.caption} px-1 py-0.5 rounded bg-[rgba(212,168,83,0.12)] ${tw.goldPrimary}`}>{s}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* AI 对话窗口（放在排盘结果下面） */}
      {baziResult && (
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-[rgba(212,168,83,0.15)]">
          <h2 className={`${fonts.heading} ${fontSizes.h2} ${tw.goldPrimary} mb-4`}>AI 命理对话</h2>

          {/* 对话记录 */}
          <div className="min-h-[200px] max-h-[400px] overflow-y-auto mb-4 space-y-3 pr-2">
            {chatMessages.length === 0 && (
              <div className={`${textStyles.muted} text-sm text-center py-8`}>输入问题，让 AI 解读你的八字</div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-[#d4a853] text-[#0a0a0f]"
                      : "bg-[#0a0a0f] text-white border border-[rgba(212,168,83,0.15)]"}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#0a0a0f] text-white border border-[rgba(212,168,83,0.15)] px-4 py-2.5 rounded-lg text-sm">
                  思考中...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入区 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !chatLoading && handleChat()}
              placeholder="输入你的问题，如：我今年财运如何？"
              className={`flex-1 bg-[#0a0a0f] border border-[rgba(212,168,83,0.15)] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#555]
                focus:outline-none focus:border-[rgba(212,168,83,0.4)] transition`}
            />
            <button
              onClick={handleChat}
              disabled={chatLoading || !inputMsg.trim()}
              className={`px-5 py-2.5 rounded-lg ${fonts.body} text-sm font-semibold transition
                ${chatLoading || !inputMsg.trim()
                  ? "bg-[rgba(212,168,83,0.3)] text-[rgba(255,255,255,0.5)] cursor-not-allowed"
                  : "bg-[#d4a853] text-[#0a0a0f] hover:bg-[#e8c878]"}`}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );

  async function handleChat() {
    if (!inputMsg.trim() || !baziResult) return;
    const userMsg = inputMsg.trim();
    setInputMsg("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/bazi/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMsg }],
          baziResult,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "对话失败");
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply || "暂无回复" }]);
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "错误：" + e.message }]);
    } finally {
      setChatLoading(false);
    }
  }
}

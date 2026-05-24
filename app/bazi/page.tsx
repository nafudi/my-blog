'use client';



import { useState, useCallback, useEffect } from 'react';

import { useSession, signIn, signOut } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';



const gold = '#d4a853';

const goldLight = '#e8c878';

const cardBg = '#1a1a2e';

const borderColor = 'rgba(212,168,83,0.1)';

const headerBg = 'rgba(212,168,83,0.15)';

const zebraBg = 'rgba(212,168,83,0.03)';

const selectedBg = '#2d2d2d';

const rightPanelBg = '#16162a';



const ELM: Record<string, string> = {

  '甲':'#5cb85c','乙':'#5cb85c','寅':'#5cb85c','卯':'#5cb85c',

  '丙':'#d9534f','丁':'#d9534f','巳':'#d9534f','午':'#d9534f',

  '戊':'#f0ad4e','己':'#f0ad4e','辰':'#f0ad4e','戌':'#f0ad4e','丑':'#f0ad4e','未':'#f0ad4e',

  '庚':'#ffffff','辛':'#ffffff','申':'#ffffff','酉':'#ffffff',

  '壬':'#5bc0de','癸':'#5bc0de','亥':'#5bc0de','子':'#5bc0de',

};

const elm = (c: string) => ELM[c] || '#ffffff';



/* ===================== 类型定义 ===================== */



interface HiddenStem {

  stem: string;

  qiType?: string;

  tenGod: string;

}



interface BranchRelation {

  type: string;

  branches: string[];

  description: string;

}



interface DayunItem {

  startYear: number;

  startAge: number;

  ganZhi: string;

  stem: string;

  branch: string;

  tenGod: string;

  branchTenGod: string;

  hiddenStems: HiddenStem[];

  naYin: string;

  diShi: string;

  shenSha: string[];

  branchRelations: BranchRelation[];

  liunianList: FlowYearItem[];

}



interface FlowYearItem {

  year: number;

  age: number;

  ganZhi: string;

  gan: string;

  zhi: string;

  tenGod: string;

  nayin: string;

  hiddenStems: HiddenStem[];

  diShi: string;

  shenSha: string[];

  branchRelations: BranchRelation[];

  taiSui?: string[];

}



interface DayunFullData {

  startAge: number;

  startAgeDetail: string;

  xiaoYun: Record<string, unknown>;

  list: DayunItem[];

  simplifiedJson?: Record<string, unknown>;

}



interface Pillar {

  柱: string;

  干支: string;

  天干十神: string;

  藏干: { 天干: string; 十神: string }[];

  地势: string;

  kongwang?: string;

  '空亡'?: string;

  纳音?: string;

  shensha?: string;

  '神煞'?: string;

}



interface BaziResult {

  基本信息: { 性别: string; 日主: string };

  四柱: Pillar[];

  干支关系?: string[];

}



/* ===================== 样式常量 ===================== */



const inputStyle: React.CSSProperties = {

  width: '100%', padding: '8px 10px', borderRadius: 6,

  border: '0.5px solid ' + borderColor, fontSize: 13,

  background: cardBg, color: '#ffffff', outline: 'none',

};



const labelStyle: React.CSSProperties = { fontSize: 11, color: '#ffffff', display: 'block', marginBottom: 4 };



/* ===================== 主组件 ===================== */



export default function BaziPage() {

  const [mode, setMode] = useState(1);

  const [gender, setGender] = useState('男');

  const [calendar, setCalendar] = useState('公历');

  const [year, setYear] = useState('1998');

  const [month, setMonth] = useState('1');

  const [day, setDay] = useState('22');

  const [time, setTime] = useState('4:00');

  const [yearZhu, setYearZhu] = useState('丁丑');

  const [monthZhu, setMonthZhu] = useState('癸丑');

  const [dayZhu, setDayZhu] = useState('己巳');

  const [hourZhu, setHourZhu] = useState('丙寅');

  const [loading, setLoading] = useState(false);

  const [baziResult, setBaziResult] = useState<BaziResult | null>(null);

  const [dayunFullData, setDayunFullData] = useState<DayunFullData | null>(null);

  const [error, setError] = useState('');

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // 右侧面板选中的大运索引

  const [selectedDayunIdx, setSelectedDayunIdx] = useState(2);



  /* ========== 覆盖父级 layout 的 max-w-5xl 限制 ========== */

  useEffect(() => {

    const main = document.querySelector('main');

    const wrapper = main?.parentElement; // lg:ml-64 min-w-0 overflow-x-hidden

    const savedMain: Record<string, string> = {};

    const savedWrapper: Record<string, string> = {};

    if (main) {

      savedMain.maxWidth = main.style.maxWidth;

      savedMain.overflowX = main.style.overflowX;

      main.style.maxWidth = 'none';

      main.style.overflowX = 'visible';

    }

    if (wrapper) {

      savedWrapper.overflowX = wrapper.style.overflowX;

      wrapper.style.overflowX = 'visible';

    }

    return () => {

      if (main) { main.style.maxWidth = savedMain.maxWidth || ''; main.style.overflowX = savedMain.overflowX || ''; }

      if (wrapper) { wrapper.style.overflowX = savedWrapper.overflowX || ''; }

    };

  }, []);



  /* ========== 输入校验 ========== */

  const clamp = (val: string, min: number, max: number) => {

    const n = parseInt(val, 10);

    if (isNaN(n)) return String(min);

    if (n < min) return String(min);

    if (n > max) return String(max);

    return String(n);

  };

  const handleYearChange = (v: string) => setYear(clamp(v.replace(/\D/g, ''), 1, 9999));

  const handleMonthChange = (v: string) => setMonth(clamp(v.replace(/\D/g, ''), 1, 12));

  const handleDayChange = (v: string) => setDay(clamp(v.replace(/\D/g, ''), 1, 31));

  const handleTimeChange = (v: string) => {

    let clean = v.replace(/[^0-9:]/g, '');

    const parts = clean.split(':');

    if (parts.length > 2) clean = parts[0] + ':' + parts[1];

    if (parts[0]?.length > 2) parts[0] = parts[0].slice(0, 2);

    if (parts[1]?.length > 2) parts[1] = parts[1].slice(0, 2);

    if (parts[0]) { const h = parseInt(parts[0], 10); if (!isNaN(h) && h > 23) parts[0] = '23'; }

    if (parts[1]) { const m = parseInt(parts[1], 10); if (!isNaN(m) && m > 59) parts[1] = '59'; }

    setTime(parts.join(':'));

  };



  const validateInputs = (): string | null => {

    const y = parseInt(year, 10), m = parseInt(month, 10), d = parseInt(day, 10);

    const [hStr, mStr] = time.replace(/：/g, ':').split(':');

    const h = parseInt(hStr || '0', 10), min = parseInt(mStr || '0', 10);

    if (isNaN(y) || y < 1 || y > 9999) return '年份范围: 1-9999';

    if (isNaN(m) || m < 1 || m > 12) return '月份范围: 1-12';

    if (isNaN(d) || d < 1 || d > 31) return '日期范围: 1-31';

    if (isNaN(h) || h < 0 || h > 23) return '小时范围: 0-23';

    if (isNaN(min) || min < 0 || min > 59) return '分钟范围: 0-59';

    const date = new Date(y, m - 1, d);

    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '请输入有效的日期';

    return null;

  };



  /* ========== API 调用 ========== */

  const callMcpApi = useCallback(async (tool: string, args: unknown) => {

    try {

      const res = await fetch('/api/mingai', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ tool, args }),

      });

      if (!res.ok) throw new Error(`请求失败 (${res.status})`);

      return await res.json();

    } catch (err) {

      console.error('[API Error]', err);

      return { error: err instanceof Error ? err.message : String(err) };

    }

  }, []);



  const callDayunApi = useCallback(async (args: Record<string, unknown>) => {

    try {

      const res = await fetch('/api/bazi-dayun', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(args),

      });

      if (!res.ok) throw new Error(`大运请求失败 (${res.status})`);

      return await res.json();

    } catch (err) {

      console.error('[Dayun API Error]', err);

      return { error: err instanceof Error ? err.message : String(err) };

    }

  }, []);



  /* ========== 提交排盘 ========== */

  const submit = useCallback(async () => {

    setLoading(true); setError('');

    setBaziResult(null);

    setDayunFullData(null);

    setCurrentConversationId(null); // 新排盘重置对话ID



    if (mode === 1) {

      const err = validateInputs();

      if (err) { setError(err); setLoading(false); return; }

    }



    try {

      const isLunar = calendar === '农历';

      const [h, m] = time.split(':').map(Number);



      if (mode === 1) {

        const baseArgs = {

          gender: gender === '男' ? 'male' : 'female',

          birthYear: parseInt(year),

          birthMonth: parseInt(month),

          birthDay: parseInt(day),

          birthHour: h || 0,

          calendarType: isLunar ? 'lunar' : 'solar',

          detailLevel: 'full',

        };



        // 并行调用：基础八字 + 大运详细数据

        const [d1, d2] = await Promise.all([

          callMcpApi('bazi', baseArgs),

          callDayunApi({

            gender: gender === '男' ? 'male' : 'female',

            birthYear: parseInt(year),

            birthMonth: parseInt(month),

            birthDay: parseInt(day),

            birthHour: h || 0,

          }),

        ]);



        if (d1?.error) {

          setError(typeof d1.error === 'string' ? d1.error : JSON.stringify(d1.error));

        } else if (d1?.structuredContent) {

          setBaziResult(d1.structuredContent);



          // 保存排盘记录到数据库，获取绑定的对话ID

          try {

            const chartResp = await fetch('/api/bazi-chart', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({

                gender: gender,

                calendarType: isLunar ? 'lunar' : 'solar',

                birthYear: parseInt(year),

                birthMonth: parseInt(month),

                birthDay: parseInt(day),

                birthHour: h || 0,

                mode: 1,

                baziData: d1.structuredContent,

                dayunData: d2?.list ? d2 as DayunFullData : null,

              }),

            });

            if (chartResp.ok) {

              const { conversationId: convId } = await chartResp.json();

              setCurrentConversationId(convId);

            }

          } catch (_) { /* 静默失败，不影响排盘展示 */ }

        }



        if (d2?.error) {

          console.warn('[bazi-dayun]', d2.error);

        } else if (d2?.list) {

          setDayunFullData(d2 as DayunFullData);

          // 默认选中当前或中间的大运

          const curYear = new Date().getFullYear();

          const defaultIdx = d2.list.findIndex(

            (dy: DayunItem) => dy.startYear <= curYear && curYear < dy.startYear + 10

          );

          setSelectedDayunIdx(defaultIdx >= 0 ? defaultIdx : Math.min(2, d2.list.length - 1));

        }

      } else {

        // 反推模式

        const args = { yearPillar: yearZhu, monthPillar: monthZhu, dayPillar: dayZhu, hourPillar: hourZhu };

        const d = await callMcpApi('bazi_pillars_resolve', args);

        if (d?.error) {

          setError(typeof d.error === 'string' ? d.error : JSON.stringify(d.error));

        } else if (d?.structuredContent) {

          setBaziResult(d.structuredContent);



          // 保存反推排盘记录（无大运数据）

          try {

            const chartResp = await fetch('/api/bazi-chart', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({

                gender: '',

                calendarType: 'solar',

                birthYear: 0, birthMonth: 0, birthDay: 0, birthHour: 0,

                mode: 2,

                baziData: d.structuredContent,

              }),

            });

            if (chartResp.ok) {

              const { conversationId: convId } = await chartResp.json();

              setCurrentConversationId(convId);

            }

          } catch (_) { /* 静默失败 */ }

        }

      }

    } catch (e: unknown) {

      setError(e instanceof Error ? e.message : String(e));

    } finally {

      setLoading(false);

    }

  }, [mode, gender, calendar, year, month, day, time, yearZhu, monthZhu, dayZhu, hourZhu, callMcpApi, callDayunApi]);



  const dayunList = dayunFullData?.list || [];

  const curDayun = dayunList[selectedDayunIdx];

  const curFlowYears = curDayun?.liunianList || [];



  /* ===================== 渲染 ===================== */

  return (

    <div style={{ width: '100%', margin: '0 auto', padding: '20px 16px 40px', color: '#ffffff', boxSizing: 'border-box' }}>

      {/* ===== 三栏布局（弹性） ===== */}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', width: '100%' }}>



        {/* ==================== 左侧：输入 + 四柱表格 ==================== */}

        <div style={{ flex: '1 1 400px', minWidth: 380 }}>

          <LeftPanel

            mode={mode} setMode={setMode}

            gender={gender} setGender={setGender}

            calendar={calendar} setCalendar={setCalendar}

            year={year} setYear={setYear}

            month={month} setMonth={setMonth}

            day={day} setDay={setDay}

            time={time} setTime={setTime}

            yearZhu={yearZhu} setYearZhu={setYearZhu}

            monthZhu={monthZhu} setMonthZhu={setMonthZhu}

            dayZhu={dayZhu} setDayZhu={setDayZhu}

            hourZhu={hourZhu} setHourZhu={setHourZhu}

            loading={loading} submit={submit}

            baziResult={baziResult} error={error}

          />

        </div>



        {/* ==================== 中间：大运流年专业细盘 ==================== */}

        <div style={{ flex: '1 1 340px', minWidth: 320 }}>

          <RightPanel

            dayunData={dayunFullData}

            selectedDayunIdx={selectedDayunIdx}

            onSelectDayun={setSelectedDayunIdx}

            baziResult={baziResult}

          />

        </div>



        {/* ==================== 右侧：AI问答框 ==================== */}

        <div style={{ flex: '1 1 280px', minWidth: 260 }}>

          <AiChatPanel baziResult={baziResult} dayunData={dayunFullData} conversationId={currentConversationId} />

        </div>



      </div>

    </div>

  );

}



/* ==================== 左侧面板组件 ==================== */



function LeftPanel(props: {

  mode: number; setMode: (m: number) => void;

  gender: string; setGender: (g: string) => void;

  calendar: string; setCalendar: (c: string) => void;

  year: string; setYear: (y: string) => void;

  month: string; setMonth: (m: string) => void;

  day: string; setDay: (d: string) => void;

  time: string; setTime: (t: string) => void;

  yearZhu: string; setYearZhu: (z: string) => void;

  monthZhu: string; setMonthZhu: (z: string) => void;

  dayZhu: string; setDayZhu: (z: string) => void;

  hourZhu: string; setHourZhu: (z: string) => void;

  loading: boolean; submit: () => void;

  baziResult: BaziResult | null;

  error: string;

}) {

  const {

    mode, setMode, gender, setGender, calendar, setCalendar,

    year, setYear, month, setMonth, day, setDay, time, setTime,

    yearZhu, setYearZhu, monthZhu, setMonthZhu, dayZhu, setDayZhu, hourZhu, setHourZhu,

    loading, submit, baziResult, error,

  } = props;



  // 输入处理函数（与主组件一致）

  const clamp = (val: string, min: number, max: number) => {

    const n = parseInt(val, 10);

    if (isNaN(n)) return String(min);

    if (n < min) return String(min);

    if (n > max) return String(max);

    return String(n);

  };

  const handleYearChange = (v: string) => setYear(clamp(v.replace(/\D/g, ''), 1, 9999));

  const handleMonthChange = (v: string) => setMonth(clamp(v.replace(/\D/g, ''), 1, 12));

  const handleDayChange = (v: string) => setDay(clamp(v.replace(/\D/g, ''), 1, 31));

  const handleTimeChange = (v: string) => {

    let clean = v.replace(/[^0-9:]/g, '');

    const parts = clean.split(':');

    if (parts.length > 2) clean = parts[0] + ':' + parts[1];

    if (parts[0]?.length > 2) parts[0] = parts[0].slice(0, 2);

    if (parts[1]?.length > 2) parts[1] = parts[1].slice(0, 2);

    if (parts[0]) { const h = parseInt(parts[0]); if (!isNaN(h) && h > 23) parts[0] = '23'; }

    if (parts[1]) { const m = parseInt(parts[1]); if (!isNaN(m) && m > 59) parts[1] = '59'; }

    setTime(parts.join(':'));

  };



  return (

    <div style={{ background: cardBg, borderRadius: 12, border: '0.5px solid ' + borderColor, overflow: 'hidden' }}>

      {/* Toggle */}

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px' }}>

        <button

          onClick={() => setMode(mode === 1 ? 2 : 1)}

          style={{

            padding: '6px 14px', borderRadius: 8, border: '0.5px solid ' + borderColor,

            background: cardBg, color: gold, fontSize: 12, cursor: 'pointer',

          }}

        >

          {mode === 1 ? '八字反推生日' : '出生日期排盘'}

        </button>

      </div>



      {/* Header */}

      <div style={{ padding: '0 20px 12px', borderBottom: '0.5px solid ' + borderColor }}>

        <div style={{ fontSize: 17, fontWeight: 600, color: goldLight }}>

          {mode === 1 ? '排盘' : '八字反推生日'}

        </div>

        <div style={{ fontSize: 12, color: '#ffffff', marginTop: 2 }}>

          {mode === 1 ? '输入出生信息后查看四柱八字、大运流年' : '输入四柱干支反推出生日期'}

        </div>

      </div>



      {/* Form */}

      <div style={{ padding: '16px 20px' }}>

        {mode === 1 ? (

          <>

            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>

              <div style={{ flex: 1 }}>

                <label style={labelStyle}>性别</label>

                <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle}>

                  <option>男</option><option>女</option>

                </select>

              </div>

              <div style={{ flex: 1 }}>

                <label style={labelStyle}>日历</label>

                <select value={calendar} onChange={e => setCalendar(e.target.value)} style={inputStyle}>

                  <option>公历</option><option>农历</option>

                </select>

              </div>

            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>

              <div style={{ flex: 1 }}><label style={labelStyle}>年</label><input type="number" value={year} onChange={e => handleYearChange(e.target.value)} min={1} max={9999} style={inputStyle} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>月</label><input type="number" value={month} onChange={e => handleMonthChange(e.target.value)} min={1} max={12} style={inputStyle} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>日</label><input type="number" value={day} onChange={e => handleDayChange(e.target.value)} min={1} max={31} style={inputStyle} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>时间</label><input type="text" value={time} onChange={e => handleTimeChange(e.target.value)} placeholder="时:分" style={inputStyle} /></div>

            </div>

          </>

        ) : (

          <>

            <div style={{ marginBottom: 12, width: '50%' }}>

              <label style={labelStyle}>性别</label>

              <select value={gender} onChange={e => setGender(e.target.value)} style={inputStyle}>

                <option>男</option><option>女</option>

              </select>

            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>

              <div style={{ flex: 1 }}><label style={labelStyle}>年柱</label><input type="text" value={yearZhu} onChange={e => setYearZhu(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>月柱</label><input type="text" value={monthZhu} onChange={e => setMonthZhu(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>日柱</label><input type="text" value={dayZhu} onChange={e => setDayZhu(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /></div>

              <div style={{ flex: 1 }}><label style={labelStyle}>时柱</label><input type="text" value={hourZhu} onChange={e => setHourZhu(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} /></div>

            </div>

          </>

        )}



        <button

          onClick={submit} disabled={loading}

          style={{

            width: '100%', padding: '12px', borderRadius: 8,

            border: '0.5px solid rgba(212,168,83,0.2)',

            background: 'rgba(212,168,83,0.08)', color: gold,

            fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',

          }}

        >

          {loading ? '计算中...' : '开始排盘'}

        </button>

        {error && <div style={{ color: '#d9534f', fontSize: 12, marginTop: 10 }}>{error}</div>}

      </div>



      {/* 四柱结果表 */}

      {baziResult && <BaziTable result={baziResult} gender={gender} />}

    </div>

  );

}



/* ==================== 右侧面板组件（大运流年专业细盘）==================== */



function RightPanel(props: {

  dayunData: DayunFullData | null;

  selectedDayunIdx: number;

  onSelectDayun: (idx: number) => void;

  baziResult: BaziResult | null;

}) {

  const { dayunData, selectedDayunIdx, onSelectDayun, baziResult } = props;



  // 未计算时显示占位

  if (!dayunData || !dayunData.list || dayunData.list.length === 0) {

    return (

      <div style={{

        background: rightPanelBg, borderRadius: 12,

        border: '0.5px solid ' + borderColor,

        minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',

      }}>

        <div style={{ textAlign: 'center', color: '#ffffff' }}>

          <div style={{ fontSize: 48, marginBottom: 12 }}>☯</div>

          <div style={{ fontSize: 14 }}>请先在左侧输入信息并点击「开始排盘」</div>

          <div style={{ fontSize: 11, marginTop: 6 }}>此处将展示大运、流年专业细盘</div>

        </div>

      </div>

    );

  }



  const dayunList = dayunData.list;

  const curDayun = dayunList[selectedDayunIdx];

  const flowYears = curDayun?.liunianList || [];



  // 计算当前岁数

  const currentYear = new Date().getFullYear();

  const riZhu = baziResult?.四柱?.find(p => p.柱 === '日柱');

  const riGanZhi = riZhu?.干支 || '';

  const dayMaster = baziResult?.基本信息?.日主 || '';



  return (

    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ===== 起运信息 Banner ===== */}

      <DayunInfoBanner

        startAge={dayunData.startAge}

        startAgeDetail={dayunData.startAgeDetail}

        curDayun={curDayun}

        currentYear={currentYear}

      />



      {/* ===== 大运卡片横向列表 ===== */}

      <DayunStrip

        dayunList={dayunList}

        selectedIndex={selectedDayunIdx}

        onSelect={onSelectDayun}

      />



      {/* ===== 流年卡片横向列表 ===== */}

      {flowYears.length > 0 && (

        <FlowYearStrip flowYears={flowYears} />

      )}



      {/* ===== 选中大运详细信息 ===== */}

      {curDayun && <DayunDetailCard dayun={curDayun} />}

    </div>

  );

}



/* ==================== 起运信息 Banner ==================== */



function DayunInfoBanner({

  startAge, startAgeDetail, curDayun, currentYear

}: {

  startAge: number;

  startAgeDetail: string;

  curDayun: DayunItem | undefined;

  currentYear: number;

}) {

  // 计算当前处于第几步大运

  let curStep = '';

  let curAgeDisplay = '';

  if (curDayun) {

    curStep = curDayun.startYear + '年 ' + curDayun.ganZhi + '大运';

    curAgeDisplay = curDayun.startAge + '岁起';

  }



  const bannerContainerStyle: React.CSSProperties = {

    background: rightPanelBg, borderRadius: 10,

    border: '0.5px solid ' + borderColor, padding: '14px 18px',

  };

  const bannerRowStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 13, lineHeight: 1.8 };



  return (

    <div style={bannerContainerStyle}>

      <div style={bannerRowStyle}>

        <div><span style={{ color: '#ffffff' }}>起运：</span><span style={{ color: goldLight }}>{startAgeDetail}</span></div>

        <div><span style={{ color: '#ffffff' }}>交运：</span><span style={{ color: '#ffffff' }}>{curStep || '-'}</span></div>

        {curDayun && (

          <div>

            <span style={{ color: '#ffffff' }}>当前：</span>

            <span style={{

              color: currentYear >= curDayun.startYear && currentYear < curDayun.startYear + 10 ? '#d9534f' : '#ffffff',

              fontWeight: 600,

            }}>{curDayun.ganZhi}</span>

            <span style={{ color: '#ffffff', marginLeft: 4 }}>({curDayun.tenGod})</span>

          </div>

        )}

      </div>

    </div>

  );

}



/* ==================== 大运卡片条（单框风格，与流年一致） ==================== */



function DayunStrip({

  dayunList, selectedIndex, onSelect

}: {

  dayunList: DayunItem[];

  selectedIndex: number;

  onSelect: (idx: number) => void;

}) {

  const curYear = new Date().getFullYear();



  return (

    <div style={{

      background: rightPanelBg, borderRadius: 10,

      border: '0.5px solid ' + borderColor, overflow: 'hidden',

    }}>

      {/* 标题栏 */}

      <div style={{

        background: headerBg, padding: '10px 16px',

        fontWeight: 600, fontSize: 14, color: goldLight,

        display: 'flex', justifyContent: 'space-between', alignItems: 'center',

      }}>

        <span>大运</span>

        <span style={{ fontSize: 11, fontWeight: 400, color: '#ffffff' }}>大运年限</span>

      </div>



      <div style={{ padding: '12px 14px' }}>

        {/* 每个大运一个完整卡片 */}

        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4 }}>

          {dayunList.map((d, i) => {

            const isCur = curYear >= d.startYear && curYear < d.startYear + 10;

            const isSelected = i === selectedIndex;

            return (

              <div

                key={i}

                onClick={() => onSelect(i)}

                style={{

                  flexShrink: 0, textAlign: 'center', padding: '7px 9px',

                  borderRadius: 7, minWidth: 58,

                  border: isCur ? '1.5px solid ' + gold : (isSelected ? '0.5px solid ' + gold : '0.5px solid rgba(255,255,255,0.06)'),

                  background: isSelected ? selectedBg : (isCur ? 'rgba(212,168,83,0.06)' : 'transparent'),

                  cursor: 'pointer', transition: 'all 0.15s',

                }}

              >

                <div style={{ fontSize: 10, color: '#ffffff' }}>{d.startAge}岁</div>

                <div style={{ fontSize: 10, color: isSelected ? '#d9534f' : '#ffffff', marginBottom: 3 }}>{d.startYear}</div>

                <div style={{ fontSize: 17, fontWeight: 600, color: elm(d.stem), margin: '1px 0' }}>{d.stem}</div>

                <div style={{ fontSize: 9, color: '#ffffff', margin: '1px 0' }}>{d.tenGod}</div>

                <div style={{ fontSize: 17, fontWeight: 600, color: elm(d.branch), margin: '1px 0' }}>{d.branch}</div>

                <div style={{ fontSize: 9, color: '#ffffff', margin: '1px 0' }}>{d.branchTenGod}</div>

                {/* 纳音小字 */}

                <div style={{ fontSize: 8, color: '#ffffff', marginTop: 2, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

                  {d.naYin || ''}

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </div>

  );

}



/* ==================== 流年卡片条 ==================== */



function FlowYearStrip({ flowYears }: { flowYears: FlowYearItem[] }) {

  const curYear = new Date().getFullYear();



  return (

    <div style={{

      background: rightPanelBg, borderRadius: 10,

      border: '0.5px solid ' + borderColor, overflow: 'hidden',

    }}>

      <div style={{ background: headerBg, padding: '10px 16px', fontWeight: 600, fontSize: 14, color: goldLight }}>

        流年

      </div>

      <div style={{ padding: '12px 14px' }}>

        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }}>

          {flowYears.map((fy, i) => {

            const isCur = fy.year === curYear;

            return (

              <div

                key={i}

                style={{

                  flexShrink: 0, textAlign: 'center', padding: '7px 10px',

                  borderRadius: 7, minWidth: 58,

                  border: isCur ? '1.5px solid ' + gold : '0.5px solid rgba(255,255,255,0.06)',

                  background: isCur ? 'rgba(212,168,83,0.06)' : 'transparent',

                }}

              >

                <div style={{ fontSize: 10, color: '#ffffff' }}>{fy.age}岁</div>

                <div style={{ fontSize: 10, color: '#ffffff', marginBottom: 3 }}>{fy.year}</div>

                <div style={{ fontSize: 17, fontWeight: 600, color: elm(fy.gan), margin: '1px 0' }}>{fy.gan}</div>

                <div style={{ fontSize: 9, color: '#ffffff', margin: '1px 0' }}>{fy.tenGod}</div>

                <div style={{ fontSize: 17, fontWeight: 600, color: elm(fy.zhi), margin: '1px 0' }}>{fy.zhi}</div>

                {/* 纳音小字 */}

                <div style={{ fontSize: 8, color: '#ffffff', marginTop: 2, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

                  {fy.nayin || ''}

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </div>

  );

}



/* ==================== 选中大运详情卡片 ==================== */



function DayunDetailCard({ dayun }: { dayun: DayunItem }) {

  const [expanded, setExpanded] = useState(true);



  return (

    <div style={{

      background: rightPanelBg, borderRadius: 10,

      border: '0.5px solid ' + borderColor, overflow: 'hidden',

    }}>

      {/* 标题 + 展开/折叠 */}

      <div

        onClick={() => setExpanded(!expanded)}

        style={{

          background: headerBg, padding: '10px 16px',

          fontWeight: 600, fontSize: 13, color: goldLight,

          display: 'flex', justifyContent: 'space-between', alignItems: 'center',

          cursor: 'pointer',

        }}

      >

        <span>{dayun.ganZhi} · {dayun.tenGod} ({dayun.startYear}-{dayun.startYear + 9})</span>

        <span style={{ fontSize: 11, fontWeight: 400, color: '#ffffff' }}>{expanded ? '收起 ▲' : '展开 ▼'}</span>

      </div>



      {expanded && (

        <div style={{ padding: '14px 16px', fontSize: 12 }}>

          {/* 基本信息 */}

          <InfoRow label="纳音" value={dayun.naYin} valueColor="#c9a96e" />

          <InfoRow label="地势" value={dayun.diShi} valueColor="#aaa" />



          {/* 藏干 */}

          {dayun.hiddenStems && dayun.hiddenStems.length > 0 && (

            <div style={{ marginBottom: 8 }}>

              <span style={{ color: '#ffffff', marginRight: 8 }}>藏干：</span>

              {dayun.hiddenStems.map((hs, i) => (

                <span key={i} style={{ marginRight: 12, display: 'inline-block' }}>

                  <span style={{ color: elm(hs.stem), fontWeight: 500 }}>{hs.stem}</span>

                  <span style={{ color: '#ffffff', fontSize: 11, marginLeft: 2 }}>({hs.qiType || ''}{hs.tenGod})</span>

                </span>

              ))}

            </div>

          )}



          {/* 神煞 */}

          {dayun.shenSha && dayun.shenSha.length > 0 && (

            <div style={{ marginBottom: 8 }}>

              <span style={{ color: '#ffffff', marginRight: 8 }}>神煞：</span>

              {dayun.shenSha.map((ss, i) => (

                <span key={i} style={{

                  display: 'inline-block', padding: '1px 6px',

                  borderRadius: 3, background: 'rgba(217,83,79,0.08)',

                  color: '#d97a76', fontSize: 11, marginRight: 4, marginBottom: 2,

                }}>{ss}</span>

              ))}

            </div>

          )}



          {/* 地支关系 */}

          {dayun.branchRelations && dayun.branchRelations.length > 0 && (

            <div style={{ marginBottom: 6 }}>

              <span style={{ color: '#ffffff', marginRight: 8 }}>关系：</span>

              {dayun.branchRelations.map((br, i) => (

                <span key={i} style={{ color: '#ffffff', fontSize: 11, marginRight: 8 }}>

                  {br.description}

                </span>

              ))}

            </div>

          )}

        </div>

      )}

    </div>

  );

}



/* ==================== 信息行组件 ==================== */



function InfoRow({ label, value, valueColor = '#ffffff' }: {

  label: string; value: string; valueColor?: string;

}) {

  return (

    <div style={{ display: 'flex', marginBottom: 6, lineHeight: 1.6 }}>

      <span style={{ color: '#ffffff', width: 48, flexShrink: 0 }}>{label}：</span>

      <span style={{ color: valueColor, fontWeight: 500 }}>{value || '-'}</span>

    </div>

  );

}



/* ==================== AI 问答面板（NextAuth 登录 + 流式输出） ==================== */



function AiChatPanel({ baziResult, dayunData, conversationId }: {

  baziResult: BaziResult | null;

  dayunData: DayunFullData | null;

  conversationId: string | null;

}) {

  // NextAuth session

  const { data: session, status } = useSession();



  // 聊天状态

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([]);

  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);



  // 内嵌登录表单状态

  const [loginEmail, setLoginEmail] = useState('');

  const [loginPassword, setLoginPassword] = useState('');

  const [loginError, setLoginError] = useState('');

  const [loginLoading, setLoginLoading] = useState(false);



  // 积分不足弹窗状态

  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);

  const [insufficientInfo, setInsufficientInfo] = useState<{ currentBalance: number; required: number } | null>(null);

  const [showDonationModal, setShowDonationModal] = useState(false);



  // 当 conversationId 变化时（排了新盘），清空旧对话

  useEffect(() => {

    if (conversationId) {

      setMessages([]);

    }

  }, [conversationId]);



  // 内嵌登录

  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();

    setLoginError('');

    setLoginLoading(true);



    const res = await signIn('credentials', {

      email: loginEmail,

      password: loginPassword,

      redirect: false,

    });



    if (res?.error) {

      setLoginError('邮箱或密码错误');

    }

    setLoginLoading(false);

  };



  // 登出

  const handleLogout = async () => {

    await signOut({ redirect: false });

    setMessages([]);

  };



  // 从排盘数据构建完整八字上下文（含大运流年全表）

  const buildBaziContext = useCallback((): string => {

    if (!baziResult) return '';

    const info = baziResult.基本信息 || {};

    const pillars = baziResult.四柱 || [];

    const relations = baziResult.干支关系 || [];

    const lines: string[] = [];

    const currentYear = new Date().getFullYear();



    // === 命局总览 ===

    lines.push('# 八字命盘\n');

    lines.push('## 命局总览');

    lines.push(`- 性别: ${info.性别 || '未知'} | 日主: ${info.日主 || ''}`);



    // === 四柱全盘 ===

    lines.push('\n### 四柱全盘\n');

    lines.push('| 柱 | 干支 | 天干(十神) | 地支藏干(十神) | 地势 | 空亡 |');

    lines.push('|---|------|------------|----------------|------|------|');



    pillars.forEach(p => {

      const hidden = (p.藏干 || []).map((h: { 天干: string; 十神: string }) => `${h.天干}(${h.十神})`).join(' ');

      const kong = p.kongwang || p['空亡'] || '-';

      lines.push(`| ${p.柱} | ${p.干支} | ${p['天干十神'] || '-'} | ${hidden || '-'} | ${p.地势 || '-'} | ${kong} |`);

    });



    // === 干支关系 ===

    if (relations.length > 0) {

      lines.push('\n### 干支关系\n');

      const ganRels: string[] = [];

      const zhiRels: string[] = [];

      relations.forEach(r => {

        if (typeof r === 'string') {

          if (r.includes('天干')) {

            ganRels.push(r);

          } else {

            zhiRels.push(r);

          }

        }

      });

      if (ganRels.length) lines.push(`- 天干: ${ganRels.join('；')}`);

      if (zhiRels.length) lines.push(`- 地支: ${zhiRels.join('；')}`);

    }



    // === 大运流年全表 ===

    if (dayunData?.list && dayunData.list.length > 0) {

      lines.push('\n## 大运流年全表\n');



      for (let i = 0; i < dayunData.list.length; i++) {

        const du = dayunData.list[i];

        const nextDu = i < dayunData.list.length - 1 ? dayunData.list[i + 1] : null;

        const isCurrentDu = currentYear >= du.startYear && (!nextDu || currentYear < nextDu.startYear);

        const marker = isCurrentDu ? ' \u2190 **当前大运**' : '';

        lines.push(`### 第${toChineseNum(i + 1)}步大运：${du.ganZhi}（${du.startAge}-${(nextDu?.startAge || du.startAge + 9)}岁 / ${du.startYear}-${(nextDu?.startYear || du.startYear + 9)}年）— ${du.tenGod}${marker}`);



        // 大运属性

        const duAttrs: string[] = [];

        if (du.naYin) duAttrs.push(`纳音:${du.naYin}`);

        if (du.diShi) duAttrs.push(`地势:${du.diShi}`);

        if (du.shenSha?.length) duAttrs.push(`神煞:${du.shenSha.join('\u3001')}`);

        lines.push(`${duAttrs.join(' | ')}\n`);



        // 流年表格

        const lns = du.liunianList || [];

        if (lns.length > 0) {

          lines.push('| 年份 | 年龄 | 流年 | 十神 | 纳音 | 地势 | 神煞 | 地支关系/太岁 |');

          lines.push('|------|------|------|------|------|------|------|-------------|');



          for (const ln of lns) {

            const isCurrentYear = ln.year === currentYear;

            const yrMarker = isCurrentYear ? ' \u2190 **今年**' : '';

            const shensha = Array.isArray(ln.shenSha) ? ln.shenSha.join('/') : (ln.shenSha || '');

            const taiSui = Array.isArray(ln.taiSui) && ln.taiSui.length ? `[${ln.taiSui.join(',')}]` : '';

            const br = Array.isArray(ln.branchRelations) && ln.branchRelations.length

              ? ln.branchRelations.map((r: BranchRelation) => `${r.type}`).join(',')

              : '';

            const noteParts = [taiSui, br].filter(Boolean);

            const note = noteParts.length ? noteParts.join(' ') : '-';

            lines.push(`| **${ln.year}**${yrMarker} | **${ln.age}岁** | ${ln.ganZhi} | ${ln.tenGod} | ${ln.nayin || '-'} | ${ln.diShi || '-'} | ${shensha} | ${note} |`);

          }

          lines.push('');

        }

      }

    }



    // 起运信息

    if (dayunData?.startAge) {

      lines.push(`\n起运年龄：${dayunData.startAge}岁 (${dayunData.startAgeDetail || ''})`);

    }



    return lines.join('\n');

  }, [baziResult, dayunData]);




  // 数字转中文（用于大运步序）

  function toChineseNum(n: number): string {

    const ch = ['一','二','三','四','五','六','七','八','九','十'];

    return n <= 10 ? ch[n - 1] : String(n);

  }


  // 发送消息（SSE 流式）

  const handleSend = async () => {

    const text = input.trim();

    if (!text || loading) return;



    setMessages(prev => [...prev, { role: 'user', text }]);

    setInput('');

    setLoading(true);



    // 前端积分预检查：余额不足时直接弹窗拦截

    try {

      const _credRes = await fetch("/api/user/credits");

      if (_credRes.ok) {

        const _credData = await _credRes.json();

        const _balance = _credData.balance ?? 0;

        if (_balance < 10) {

          setInsufficientInfo({ currentBalance: _balance, required: 10 });

          setShowInsufficientCredits(true);

          // 回退已添加的用户消息和AI占位消息

          setMessages(prev => prev.slice(0, -2));

          setLoading(false);

          return;

        }

      }

    } catch (_) {}



    let aiMsgIndex = -1;

    setMessages(prev => {

      aiMsgIndex = prev.length;

      return [...prev, { role: 'ai', text: '' }];

    });



    try {

      const baziContext = buildBaziContext();

      const resp = await fetch('/api/ai-chat', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          question: text,

          baziContext,

          conversationId: conversationId || undefined,

        }),

      });



      if (!resp.ok) {

        // 积分不足特殊处理

        if (resp.status === 402) {

          const errData = await resp.json().catch(() => ({ currentBalance: 0, required: 10 }));

          setInsufficientInfo({ currentBalance: errData.currentBalance ?? 0, required: errData.required ?? 10 });

          setShowInsufficientCredits(true);

          // 回退用户消息

          setMessages(prev => prev.slice(0, -1));

          setLoading(false);

          return;

        }

        const errData = await resp.json().catch(() => ({ error: '请求失败' }));

        throw new Error(errData.error || `HTTP ${resp.status}`);

      }



      const reader = resp.body!.getReader();

      const decoder = new TextDecoder();

      let fullText = '';



      while (true) {

        const { done, value } = await reader.read();

        if (done) break;



        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split('\n')) {

          const trimmed = line.trim();

          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const data = trimmed.slice(5).trim();

          if (data === '[DONE]') continue;



          try {

            const parsed = JSON.parse(data);

            if (parsed.content) {

              fullText += parsed.content;

              setMessages(prev =>

                prev.map((m, i) =>

                  i === aiMsgIndex ? { ...m, text: fullText } : m

                )

              );

            }

          } catch {}

        }

      }

    } catch (err: unknown) {

      const errMsg = err instanceof Error ? err.message : String(err);

      setMessages(prev =>

        prev.map((m, i) =>

          i === aiMsgIndex ? { ...m, text: `请求失败: ${errMsg}` } : m

        )

      );

    } finally {

      setLoading(false);

    }

  };



  // ===== 加载中 =====

  if (status === 'loading') {

    return (

      <div style={{

        background: cardBg, borderRadius: 12,

        border: '0.5px solid ' + borderColor, overflow: 'hidden',

        display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 500,

        alignItems: 'center', justifyContent: 'center',

      }}>

        <div style={{ color: '#ffffff' }}>检查登录状态...</div>

      </div>

    );

  }



  // ===== 未登录 → 内嵌邮箱密码登录 =====

  if (!session) {

    return (

      <div style={{

        background: cardBg, borderRadius: 12,

        border: '0.5px solid ' + borderColor, overflow: 'hidden',

        display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 500,

      }}>

        {/* 标题栏 */}

        <div style={{

          background: headerBg, padding: '12px 16px',

          fontWeight: 600, fontSize: 14, color: goldLight,

          display: 'flex', alignItems: 'center', gap: 8,

        }}>

          <span>🤖</span><span>AI 八字解读</span>

        </div>



        {/* 登录表单 */}

        <div style={{

          flex: 1, display: 'flex', flexDirection: 'column',

          alignItems: 'center', justifyContent: 'center', padding: '24px',

        }}>

          <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>

          <div style={{ fontSize: 15, color: goldLight, marginBottom: 8 }}>需要登录才能使用 AI 解读</div>

          <div style={{ fontSize: 12, color: '#ffffff', marginBottom: 24 }}>

            使用易理账号登录，与博客系统账号互通

          </div>



          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 280 }}>

            <div style={{ marginBottom: 12 }}>

              <input

                type="email"

                value={loginEmail}

                onChange={e => setLoginEmail(e.target.value)}

                placeholder="邮箱"

                required

                disabled={loginLoading}

                autoFocus

                style={{

                  width: '100%', padding: '10px 14px', borderRadius: 8,

                  border: '0.5px solid ' + borderColor, fontSize: 14,

                  background: rightPanelBg, color: '#ffffff', outline: 'none',

                  boxSizing: 'border-box',

                }}

              />

            </div>

            <div style={{ marginBottom: 12 }}>

              <input

                type="password"

                value={loginPassword}

                onChange={e => setLoginPassword(e.target.value)}

                placeholder="密码"

                required

                disabled={loginLoading}

                style={{

                  width: '100%', padding: '10px 14px', borderRadius: 8,

                  border: '0.5px solid ' + borderColor, fontSize: 14,

                  background: rightPanelBg, color: '#ffffff', outline: 'none',

                  boxSizing: 'border-box',

                }}

              />

            </div>



            {loginError && (

              <div style={{

                color: '#d9534f', fontSize: 12, marginBottom: 12, textAlign: 'center',

              }}>{loginError}</div>

            )}



            <button

              type="submit"

              disabled={loginLoading || !loginEmail || !loginPassword}

              style={{

                width: '100%', padding: '10px', borderRadius: 8,

                border: loginLoading ? 'none' : '0.5px solid rgba(212,168,83,0.3)',

                background: loginLoading ? 'transparent' : 'rgba(212,168,83,0.1)',

                color: loginLoading ? '#ffffff' : gold,

                fontWeight: 600, fontSize: 14,

                cursor: loginLoading ? 'not-allowed' : 'pointer',

              }}

            >

              {loginLoading ? '登录中...' : '登 录'}

            </button>

          </form>



          {/* 注册链接 */}

          <div style={{ marginTop: 20, fontSize: 12, color: '#ffffff' }}>

            没有账号？

            <a href="/register" style={{ color: gold, textDecoration: 'none' }}>去注册</a>

          </div>

        </div>

      </div>

    );

  }



  // ===== 已登录 - 聊天 UI =====

  const userName = session.user?.name || session.user?.email || '用户';



  return (

    <div style={{

      background: cardBg, borderRadius: 12,

      border: '0.5px solid ' + borderColor, overflow: 'hidden',

      display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: 500,

      position: 'relative', // 为积分不足弹窗的绝对定位提供参考

    }}>

      {/* 标题栏 */}

      <div style={{

        background: headerBg, padding: '10px 16px',

        fontWeight: 600, fontSize: 13, color: goldLight,

        display: 'flex', alignItems: 'center', justifyContent: 'space-between',

      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

          <span>🤖</span>

          <span>AI 八字解读</span>

          <span style={{ fontSize: 11, fontWeight: 400, color: '#ffffff' }}>({userName})</span>

        </div>

        <button

          onClick={handleLogout}

          style={{

            padding: '3px 10px', borderRadius: 6,

            border: '0.5px solid rgba(255,255,255,0.08)',

            background: 'transparent', color: '#ffffff', fontSize: 11,

            cursor: 'pointer',

          }}

        >

          退出

        </button>

      </div>



      {/* 消息区域 */}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {messages.length === 0 && (

          <div style={{ textAlign: 'center', color: '#ffffff', marginTop: 60 }}>

            <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>

            <div style={{ fontSize: 13 }}>输入问题，AI 帮你解读八字</div>

            {baziResult && (

              <div style={{ fontSize: 11, color: '#ffffff', marginTop: 4 }}>已加载排盘数据，可直接提问</div>

            )}

            {!baziResult && (

              <div style={{ fontSize: 11, color: '#ffffff', marginTop: 4 }}>请先在左侧排盘，再向 AI 提问</div>

            )}

          </div>

        )}

        {messages.map((msg, i) => (

          <div key={i} style={{

            padding: '8px 12px', borderRadius: 8, maxWidth: '92%',

            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',

            background: msg.role === 'user' ? 'rgba(212,168,83,0.12)' : 'rgba(255,255,255,0.05)',

            fontSize: 13, lineHeight: 1.7, color: '#ffffff',

            wordBreak: 'break-word',

          }}>

            {msg.role === 'ai' ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="ai-markdown">
                {msg.text || '思考中...'}
              </ReactMarkdown>
            ) : (
              <span>{msg.text || ''}</span>
            )}

          </div>

        ))}

        {loading && (!messages.length || messages[messages.length - 1]?.text) && (

          <div style={{

            padding: '8px 12px', borderRadius: 8,

            background: 'rgba(255,255,255,0.04)', fontSize: 12,

            color: '#ffffff', alignSelf: 'flex-start',

            display: 'flex', alignItems: 'center', gap: 6,

          }}>

            <span style={{

              display: 'inline-block', width: 8, height: 8,

              borderRadius: '50%', background: gold,

              animation: 'pulse 1s ease-in-out infinite',

            }} />

            正在思考...

          </div>

        )}

      </div>



      {/* 输入区域 */}

      <div style={{ padding: '12px', borderTop: '0.5px solid ' + borderColor }}>

        <div style={{ display: 'flex', gap: 8 }}>

          <input

            type="text"

            value={input}

            onChange={e => setInput(e.target.value)}

            onKeyDown={e => e.key === 'Enter' && handleSend()}

            placeholder="输入你的问题..."

            disabled={loading}

            style={{

              flex: 1, padding: '8px 12px', borderRadius: 8,

              border: '0.5px solid ' + borderColor, fontSize: 13,

              background: rightPanelBg, color: '#ffffff', outline: 'none',

            }}

          />

          <button

            onClick={handleSend}

            disabled={loading || !input.trim()}

            style={{

              padding: '8px 16px', borderRadius: 8,

              border: loading ? 'none' : '0.5px solid rgba(212,168,83,0.3)',

              background: loading ? 'transparent' : 'rgba(212,168,83,0.1)',

              color: loading ? '#ffffff' : gold, fontWeight: 600,

              fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',

            }}

          >

            发送

          </button>

        </div>

      </div>



      {/* ===== 积分不足提示弹窗（CreditsModal 同款模式）===== */}

      {showInsufficientCredits && insufficientInfo && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"

          onClick={(e) => { if (e.target === e.currentTarget) setShowInsufficientCredits(false); }}>

          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInsufficientCredits(false)} />

          <div

            className="relative bg-[#12121a] border border-[rgba(212,168,83,0.15)] rounded-2xl p-6 w-full max-w-[340px] shadow-2xl"

            style={{ zIndex: 61 }}

          >

            <button

              onClick={() => setShowInsufficientCredits(false)}

              className="absolute top-4 right-4 text-[#555] hover:text-[#e8e6e3] transition-colors text-lg"

            >✕</button>



            <div style={{ textAlign: 'center', marginBottom: 16 }}>

              <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>

              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#d4a853', marginBottom: 4 }}>积分不足</h3>

            </div>



            <p style={{ fontSize: 13, color: '#ffffff', marginBottom: 16, textAlign: 'center', lineHeight: 1.6 }}>

              每次AI问答消耗 <span style={{ color: '#d4a853', fontWeight: 600 }}>{insufficientInfo.required}</span> 积分<br/>

              当前余额：<span style={{ color: '#d9534f', fontWeight: 600 }}>{insufficientInfo.currentBalance}</span> 积分

            </p>



            <p style={{ fontSize: 11, color: '#ffffff', marginBottom: 20, textAlign: 'center' }}>

              本站由个人维护，调用AI计算资源需要成本

            </p>



            <div style={{ display: 'flex', gap: 10 }}>

              <button

                onClick={() => setShowInsufficientCredits(false)}

                style={{

                  flex: 1, padding: '10px', borderRadius: 10,

                  background: 'transparent', border: '0.5px solid #333',

                  color: '#ffffff', fontSize: 13, cursor: 'pointer',

                }}

              >稍后再说</button>

              <button

                onClick={() => { setShowInsufficientCredits(false); setShowDonationModal(true); }}

                style={{

                  flex: 1, padding: '10px', borderRadius: 10,

                  background: 'linear-gradient(135deg, #d4a853, #a67c3d)',

                  border: 'none', color: '#0a0a0f', fontWeight: 600, fontSize: 13, cursor: 'pointer',

                }}

              >💰 去打赏</button>

            </div>

          </div>

        </div>

      )}



      {/* ===== 打赏弹窗（简化内嵌版）===== */}

      {showDonationModal && (

        <RechargeModal

          onClose={() => { setShowDonationModal(false); }}

        />

      )}



      <style>{`

        @keyframes pulse {

          0%, 100% { opacity: 1; }

          50% { opacity: 0.3; }

        }

      `}</style>

    </div>

  );

}



/* ==================== 打赏弹窗组件（AI面板内嵌用） ==================== */



const RECHARGE_OPTS = [

  { label: '5元', value: 500, credits: 10 },

  { label: '10元', value: 1000, credits: 20 },

  { label: '20元', value: 2000, credits: 40 },

];



function RechargeModal({ onClose }: { onClose: () => void }) {

  const [step, setStep] = useState<'select' | 'qrcode'>('select');

  const [amount, setAmount] = useState(1000);

  const [payMethod, setPayMethod] = useState<'alipay' | 'wechat'>('alipay');



  const qrImg = payMethod === 'wechat' ? '/donations/wechat.jpg' : '/donations/alipay.jpg';

  const qrLabel = payMethod === 'wechat' ? '微信' : '支付宝';

  const qrColor = payMethod === 'wechat' ? '#07C160' : '#1677FF';



  return (

    <div style={{

      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',

      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, borderRadius: 12,

    }}>

      <div style={{

        background: '#12121a', border: '1px solid rgba(212,168,83,0.15)',

        borderRadius: 16, padding: '24px', width: '92%', maxWidth: 320,

      }}>

        {/* 标题栏 */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>

          <h3 style={{ fontSize: 17, fontWeight: 600, color: goldLight }}>💰 打赏支持</h3>

          <button onClick={onClose} style={{ color: '#ffffff', fontSize: 18 }}>✕</button>

        </div>



        {step === 'select' && (

          <>

            <p style={{ fontSize: 13, color: '#ffffff', marginBottom: 10 }}>选择打赏金额</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>

              {RECHARGE_OPTS.map((opt) => (

                <button key={opt.value} onClick={() => setAmount(opt.value)}

                  style={{

                    padding: '12px', borderRadius: 10, fontSize: 13,

                    border: amount === opt.value ? `1.5px solid ${gold}` : '0.5px solid #333',

                    background: amount === opt.value ? 'rgba(212,168,83,0.12)' : 'transparent',

                    color: amount === opt.value ? gold : '#ffffff',

                    cursor: 'pointer', textAlign: 'center',

                  }}>

                  <span style={{ fontWeight: 600, display: 'block' }}>{opt.label}</span>

                  <span style={{ fontSize: 11, opacity: 0.7 }}>{opt.credits}积分</span>

                </button>

              ))}

            </div>

            <p style={{ fontSize: 13, color: '#ffffff', marginBottom: 10 }}>选择支付方式</p>

            <div style={{ display: 'flex', gap: 8 }}>

              <button onClick={() => { setPayMethod('alipay'); setStep('qrcode'); }}

                style={{

                  flex: 1, padding: '14px 8px', borderRadius: 10, fontSize: 13,

                  border: '0.5px solid #1677FF', background: 'rgba(22,119,255,0.08)', color: '#1677FF',

                }}>🔵 支付宝</button>

              <button onClick={() => { setPayMethod('wechat'); setStep('qrcode'); }}

                style={{

                  flex: 1, padding: '14px 8px', borderRadius: 10, fontSize: 13,

                  border: '0.5px solid #07C160', background: 'rgba(7,193,96,0.08)', color: '#07C160',

                }}>💚 微信支付</button>

            </div>

          </>

        )}



        {step === 'qrcode' && (

          <div style={{ textAlign: 'center' }}>

            <p style={{ fontSize: 13, color: '#ffffff', marginBottom: 12 }}>

              请使用<span style={{ color: qrColor }}>{qrLabel}</span>扫码打赏

              <span style={{ fontWeight: 600 }}> {(amount / 100).toFixed(0)}元</span>

            </p>

            {/* 二维码图片 */}

            <div style={{

              width: 200, height: 200, margin: '0 auto 12px', borderRadius: 12,

              border: `2px solid ${qrColor}`, overflow: 'hidden', background: '#fff',

            }}>

              <img src={qrImg} alt={`${qrLabel}二维码`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

            </div>

            <p style={{ fontSize: 12, color: '#d4a853', margin: '8px 0', lineHeight: 1.5 }}>

              💡 打赏后请联系站长确认到账<br/>

              <span style={{ color: '#ffffff' }}>（自动回传功能开发中，敬请期待）</span>

            </p>

            <button onClick={() => setStep('select')}

              style={{

                flex: 1, padding: '10px', borderRadius: 10, width: '100%',

                background: 'transparent', border: '0.5px solid #333',

                color: '#ffffff', fontSize: 13, cursor: 'pointer',

              }}>返回</button>

          </div>

        )}

      </div>

    </div>

  );

}



/* ==================== 四柱表格组件（保持原样） ===================== */



function BaziTable({ result, gender }: { result: BaziResult; gender: string }) {

  const pillars = result.四柱 || [];

  if (!pillars.length) return null;



  const toDisplayString = (val: unknown): string => {

    if (Array.isArray(val)) return val.join('、');

    if (typeof val === 'string') return val;

    return '';

  };



  // 日柱主星：男→元男，女→元女

  const getMainStar = (p: Pillar): string => {

    if (p.柱 === '日柱') {

      return gender === '男' ? '元男' : '元女';

    }

    return p['天干十神'] || '';

  };



  const rows: Array<{ label: string; render: (p: Pillar) => { gz?: boolean; multi?: boolean; text: string } | string }> = [

    { label: '主星', render: (p) => getMainStar(p) },

    { label: '天干', render: (p) => ({ gz: true, text: p.干支?.[0] || '' }) },

    { label: '地支', render: (p) => ({ gz: true, text: p.干支?.[1] || '' }) },

    { label: '藏干', render: (p) => ({ multi: true, text: (p.藏干 || []).map(h => h.天干).join('\n') }) },

    { label: '副星', render: (p) => ({ multi: true, text: (p.藏干 || []).map(h => h.十神).join('\n') }) },

    { label: '纳音', render: (p) => p.纳音 || '' },

    { label: '星运', render: (p) => p.地势 || '' },

    { label: '空亡', render: (p) => toDisplayString(p.kongwang || p['空亡']) },

    { label: '神煞', render: (p) => ({ multi: true, text: toDisplayString(p.shensha || p['神煞']).split('、').filter(Boolean).join('\n') }) },

  ];



  return (

    <div style={{ borderTop: '0.5px solid ' + borderColor, overflowX: 'hidden' }}>

      <div style={{ padding: 12 }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, tableLayout: 'fixed' }}>

          <thead>

            <tr style={{ background: headerBg }}>

              <th style={{ padding: '7px 6px', fontWeight: 600, fontSize: 12, border: '0.5px solid rgba(212,168,83,0.08)', width: 56, textAlign: 'left', color: goldLight }}>日期</th>

              {pillars.map((p, i) => (

                <th key={i} style={{ padding: '7px 4px', fontWeight: 600, fontSize: 12, border: '0.5px solid rgba(212,168,83,0.08)', textAlign: 'center', color: goldLight }}>{p.柱 || ''}</th>

              ))}

            </tr>

          </thead>

          <tbody>

            {rows.map((row, ri) => (

              <tr key={ri} style={{ background: ri % 2 === 0 ? zebraBg : 'transparent' }}>

                <td style={{ padding: '7px 6px', border: '0.5px solid rgba(212,168,83,0.06)', color: '#ffffff', fontSize: 12 }}>{row.label}</td>

                {pillars.map((p, ci) => {

                  const val = row.render(p);

                  const valObj = typeof val === 'object' ? val as Record<string, unknown> : null;

                  const isGz = valObj?.gz === true;

                  const isMulti = valObj?.multi === true;

                  const text = typeof val === 'string' ? val : (valObj?.text as string) || '';

                  return (

                    <td key={ci} style={{

                      padding: isMulti ? '4px 4px' : '7px 4px',

                      border: '0.5px solid rgba(212,168,83,0.06)',

                      textAlign: 'center', fontSize: isMulti ? 11 : 12,

                      color: '#ffffff', whiteSpace: isMulti ? 'pre-line' : 'nowrap',

                    }}>

                      {isGz ? (

                        <span style={{ display: 'inline-block', background: '#111', color: elm(text), padding: '3px 8px', borderRadius: 5, fontSize: 16, fontWeight: 600 }}>{text}</span>

                      ) : isMulti ? (

                        <span style={{ lineHeight: 1.7 }}>{text}</span>

                      ) : text}

                    </td>

                  );

                })}

              </tr>

            ))}

          </tbody>

        </table>



        {/* 五行图例 */}

        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#ffffff', marginTop: 10 }}>

          <span style={{ color: '#d9534f' }}>■ 火</span>

          <span style={{ color: '#f0ad4e' }}>■ 土</span>

          <span style={{ color: '#5bc0de' }}>■ 水</span>

          <span style={{ color: '#5cb85c' }}>■ 木</span>

          <span style={{ color: '#ffffff' }}>■ 金</span>

        </div>



        {/* 干支关系 */}

        {result.干支关系 && result.干支关系.length > 0 && (

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid rgba(212,168,83,0.06)', fontSize: 13, color: '#ffffff' }}>

            干支关系：{result.干支关系.join('、')}

          </div>

        )}

      </div>

    </div>

  );

}


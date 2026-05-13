"use client";

import { useState, useEffect } from "react";
import { colors, fonts, fontSizes } from "@/lib/theme";

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

export default function BaziAnalysisPage() {
  const [result, setResult] = useState<BaziResult | null>(null);
  const [analysis, setAnalysis] = useState<MingLiAnalysis | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const savedResult = localStorage.getItem("baziResult");
    const savedAnalysis = localStorage.getItem("baziAnalysis");
    if (savedResult && savedAnalysis) {
      try {
        setResult(JSON.parse(savedResult));
        setAnalysis(JSON.parse(savedAnalysis));
      } catch {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, []);

  const wuXingColor: Record<string, string> = {
    "木": "#4CAF50",
    "火": "#F44336",
    "土": "#FF9800",
    "金": "#9C27B0",
    "水": "#2196F3",
  };

  if (notFound || !result || !analysis) {
    return (
      <div className="min-h-screen py-8 px-4" style={{ background: colors.bgPrimary }}>
        <div className="max-w-3xl mx-auto text-center">
          <h1 className={`${fonts.heading} ${fontSizes.hero} glow-text mb-4`}>
            🔮 命理解析
          </h1>
          <p style={{ color: colors.textSecondary }} className="mb-8">
            暂无排盘数据，请先前往八字排盘页面进行排盘。
          </p>
          <a
            href="/bazi"
            className="inline-block px-6 py-3 rounded-lg"
            style={{
              background: "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.1))",
              color: colors.goldPrimary,
              border: "1px solid rgba(212,168,83,0.3)",
            }}
          >
            ← 返回八字排盘
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: colors.bgPrimary }}>
      <div className="max-w-3xl mx-auto">

        {/* 标题 */}
        <div className="text-center mb-12">
          <h1 className={`${fonts.heading} ${fontSizes.hero} glow-text mb-4`}>
            🔮 命理解析
          </h1>
          <p style={{ color: colors.textSecondary }}>
            {result.name} · {result.gender}命 · {result.birthDate}
          </p>
        </div>

        {/* 日主状态 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            日主状态
          </h3>
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
              {analysis.isWang ? "日主得令，精力旺盛，天赋过人" :
               analysis.isShuai ? "日主失令，根基较弱，需大运扶助" :
               "日主中和，需结合大运流年来看"}
            </p>
          </div>
        </div>

        {/* 格局分析 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            格局分析
          </h3>
          <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
            <div className="mb-2">
              <span className="text-lg" style={{ color: colors.goldPrimary }}>{analysis.geJu}</span>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {analysis.geJuDesc}
            </p>
          </div>
        </div>

        {/* 性格特点 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            性格特点
          </h3>
          <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              {analysis.personality}
            </p>
          </div>
        </div>

        {/* 五行建议 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            五行建议
          </h3>
          <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              五行最旺：<span style={{ color: wuXingColor[analysis.maxWuXing] }}>{analysis.maxWuXing}</span>
              {" "}五行最弱：<span style={{ color: wuXingColor[analysis.minWuXing] }}>{analysis.minWuXing}</span>
            </p>
            {analysis.tiaoHou && (
              <p className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                💡 调候建议：{analysis.tiaoHou}
              </p>
            )}
          </div>
        </div>

        {/* 十神关系 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            十神关系
          </h3>
          <div className="p-4 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>年柱：<span style={{ color: colors.goldPrimary }}>{analysis.yearShiShen}</span></div>
              <div>月柱：<span style={{ color: colors.goldPrimary }}>{analysis.monthShiShen}</span></div>
              <div>时柱：<span style={{ color: colors.goldPrimary }}>{analysis.hourShiShen}</span></div>
            </div>
          </div>
        </div>

        {/* 大运概况 */}
        <div className="rounded-2xl p-6 border mb-6" style={{ background: "rgba(18,18,26,0.6)", borderColor: "rgba(212,168,83,0.15)" }}>
          <h3 className={`${fonts.heading} ${fontSizes.h3} mb-4`} style={{ color: colors.goldPrimary }}>
            大运概况
          </h3>
          <div className="space-y-2">
            {result.daYun.pillars.map((pillar, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: "rgba(212,168,83,0.05)" }}>
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

        {/* 返回按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-3 rounded-lg border"
            style={{ borderColor: "rgba(212,168,83,0.2)", color: colors.textSecondary }}
          >
            ← 返回排盘结果
          </button>
          <button
            onClick={() => { localStorage.removeItem("baziResult"); localStorage.removeItem("baziAnalysis"); window.location.href = "/bazi"; }}
            className="flex-1 py-3 rounded-lg font-medium"
            style={{
              background: "linear-gradient(135deg, rgba(212,168,83,0.3), rgba(212,168,83,0.1))",
              color: colors.goldPrimary,
              border: "1px solid rgba(212,168,83,0.3)",
            }}
          >
            🔄 重新排盘
          </button>
        </div>

        <div className="mt-8 text-center" style={{ color: colors.textMuted }}>
          <p className={fontSizes.caption}>
            ☯ 本解析基于传统命理学算法，由规则引擎生成，结果仅供参考娱乐
          </p>
          <p className="mt-1 text-xs" style={{ color: "rgba(212,168,83,0.3)" }}>
            如需AI深度解析，请提供外部接口支持
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 博客主题配置 - 集中管理所有文字样式
 * 修改此处即可全局调整字体、大小、颜色
 */

// ========== 文字颜色配置 ==========
export const colors = {
  // 主文字（标题、重要内容）
  textPrimary: "#ffffff",      // 主要文字 - 纯白
  textSecondary: "#ffffff",    // 次要文字 - 纯白
  textTertiary: "#d0d0d0",     // 辅助文字 - 亮灰
  textMuted: "#aaaaaa",        // 弱化文字 - 中灰

  // 金色系（品牌色）
  goldPrimary: "#d4a853",      // 主金色 - 标题、高亮
  goldLight: "#e8c878",        // 浅金色 - hover状态
  goldDark: "#a67c3d",         // 深金色 - 边框、装饰

  // 背景色
  bgPrimary: "#0a0a0f",
  bgSecondary: "#12121a",
  bgCard: "#1a1a2e",
  bgBody: "#020205",

  // 边框色
  borderColor: "rgba(212, 168, 83, 0.15)",
} as const;

// ========== 文字大小配置 ==========
export const fontSizes = {
  // 标题
  hero: "text-5xl sm:text-7xl",      // 首页大标题
  h1: "text-3xl sm:text-4xl",        // 页面标题
  h2: "text-2xl",                     // 区块标题
  h3: "text-xl",                      // 卡片标题
  h4: "text-lg",                      // 小标题

  // 正文
  body: "text-base",                  // 正文
  bodySm: "text-sm",                  // 小字正文
  caption: "text-xs",                 // 辅助文字

  // 特殊
  tag: "text-xs",                     // 标签
  badge: "text-xs",                   // 徽章
} as const;

// ========== 字重配置 ==========
export const fontWeights = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

// ========== 字体族配置 ==========
export const fonts = {
  // 标题字体（马善政毛笔楷）
  heading: "font-[family-name:var(--font-ma-shan)]",
  // 正文字体
  body: "font-sans",
  // 等宽字体
  mono: "font-mono",
} as const;

// ========== 行高配置 ==========
export const lineHeights = {
  tight: "leading-tight",    // 标题
  normal: "leading-normal",  // 正文
  relaxed: "leading-relaxed", // 描述
} as const;

// ========== 预设样式组合（常用组合）==========
export const textStyles = {
  // 首页大标题
  hero: `${fonts.heading} ${fontSizes.hero} ${fontWeights.bold} ${lineHeights.tight}`,

  // 区块标题（如"溯源"、"杂谈"）
  sectionTitle: `${fonts.heading} ${fontSizes.h2} text-[${colors.goldPrimary}]`,

  // 卡片标题
  cardTitle: `${fonts.heading} ${fontSizes.h3} text-[${colors.goldLight}] hover:text-[${colors.goldPrimary}] transition-colors duration-300`,

  // 卡片描述
  cardDesc: `${fontSizes.bodySm} text-[${colors.textSecondary}] ${lineHeights.relaxed} line-clamp-3`,

  // 导航链接
  navLink: `${fontSizes.bodySm} text-[${colors.textSecondary}] hover:text-[${colors.goldPrimary}] transition-colors duration-300`,
  navLinkActive: `${fontSizes.bodySm} text-[${colors.goldPrimary}]`,

  // 侧边栏分类标题
  sidebarCategory: `${fontSizes.bodySm} ${fontWeights.medium} text-[${colors.textSecondary}]`,

  // 侧边栏文章链接
  sidebarLink: `${fontSizes.bodySm} text-[${colors.textSecondary}] hover:text-[${colors.textPrimary}] transition-colors`,
  sidebarLinkActive: `${fontSizes.bodySm} text-[${colors.goldPrimary}] bg-[rgba(212,168,83,0.12)]`,

  // 标签
  tag: `${fontSizes.tag} px-2 py-0.5 rounded-full bg-[rgba(212,168,83,0.12)] text-[${colors.goldPrimary}]`,

  // 日期
  date: `${fontSizes.caption} text-[${colors.textTertiary}]`,

  // 徽章（数量）
  badge: `${fontSizes.badge} text-[${colors.textTertiary}] bg-[rgba(212,168,83,0.08)] px-1.5 py-0.5 rounded-full`,

  // 副标题/描述
  subtitle: `${fontSizes.body} text-[${colors.textSecondary}] ${lineHeights.relaxed}`,

  // 装饰性小字
  muted: `${fontSizes.caption} text-[${colors.textMuted}]`,
} as const;

// ========== 快捷导出（用于 Tailwind 类名）==========
export const tw = {
  // 颜色
  textPrimary: `text-[${colors.textPrimary}]`,
  textSecondary: `text-[${colors.textSecondary}]`,
  textTertiary: `text-[${colors.textTertiary}]`,
  textMuted: `text-[${colors.textMuted}]`,
  goldPrimary: `text-[${colors.goldPrimary}]`,
  goldLight: `text-[${colors.goldLight}]`,
  goldDark: `text-[${colors.goldDark}]`,

  // 背景
  bgCard: `bg-[${colors.bgCard}]`,

  // 边框
  border: `border-[${colors.borderColor}]`,
} as const;

// 导出默认配置对象
export default {
  colors,
  fontSizes,
  fontWeights,
  fonts,
  lineHeights,
  textStyles,
  tw,
};

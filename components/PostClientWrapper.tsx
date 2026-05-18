"use client";

import { useActiveToc } from "@/components/Sidebar";
import Comments from "@/components/Comments";
import DonationModal from "@/components/DonationModal";
import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface PostClientWrapperProps {
  slug: string;
  postTitle: string;
  postDescription?: string;
}

// ========== CSS 作用域隔离工具 ==========

/**
 * 将文章提取的 CSS 选择器限定在 .article-content 作用域内，
 * 防止文章样式泄漏影响导航栏、侧边栏等全局组件。
 */
function scopeArticleStyles(rawCSS: string): string {
  // 移除 CSS 注释
  let css = rawCSS.replace(/\/\*[\s\S]*?\*\//g, "");
  return scopeCSSBlock(css);
}

function scopeCSSBlock(css: string): string {
  let result = "";
  let i = 0;

  while (i < css.length) {
    // 保留空白字符
    while (i < css.length && /\s/.test(css[i]) && css[i] !== "{") {
      result += css[i];
      i++;
    }
    if (i >= css.length) break;

    // 处理 @-规则
    if (css[i] === "@") {
      const atMatch = css.substring(i).match(
        /^(media|keyframes|supports|font-face|import|charset)\b/
      );
      if (atMatch) {
        const ruleType = atMatch[1];
        const ruleStart = i;

        // 找到开括号
        let j = i;
        while (j < css.length && css[j] !== "{") j++;
        const prelude = css.substring(i, j + 1);
        j++;

        // 找到匹配的闭括号
        let depth = 1;
        while (j < css.length && depth > 0) {
          if (css[j] === "{") depth++;
          if (css[j] === "}") depth--;
          j++;
        }

        const innerContent = css.substring(ruleStart + prelude.length, j - 1);

        if (ruleType === "keyframes") {
          // keyframes 不需要作用域化
          result += css.substring(ruleStart, j);
        } else {
          // @media 等块内部递归作用域化
          const scopedInner = scopeCSSBlock(innerContent);
          result += prelude + scopedInner + "}";
        }
        i = j;
      } else {
        result += css[i];
        i++;
      }
    } else {
      // 普通选择器块
      let j = i;
      while (j < css.length && css[j] !== "{") j++;

      if (j >= css.length) {
        result += css.substring(i);
        break;
      }

      const selectorPart = css.substring(i, j).trim();
      j++; // 跳过 {

      // 找到匹配的闭括号
      let depth = 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        if (css[j] === "}") depth--;
        j++;
      }

      const declarations = css.substring(i + selectorPart.length + 1, j - 1);

      // 检查是否为危险的全局选择器 —— 直接丢弃
      const selectors = selectorPart.split(",").map((s) => s.trim());
      const isDangerous = selectors.some((s) =>
        /^(?:\*|body|html|#bg-canvas|\.container)$/.test(s)
      );

      if (isDangerous) {
        // 跳过此规则
      } else {
        // 为每个选择器添加 .article-content 前缀
        const scopedSelectors = selectors
          .map((s) => {
            if (!s) return s;
            if (s.startsWith(".article-content")) return s;
            return `.article-content ${s}`;
          })
          .join(", ");

        result += scopedSelectors + "{" + declarations + "}";
      }

      i = j;
    }
  }

  return result;
}

// ========== HTML 清理工具 ==========

/**
 * 清理文章 HTML 中的结构性元素：
 * - 移除 <canvas> 元素（文章自带背景，博客已有 StarBg）
 * - 移除 <script> 元素（防止脚本干扰博客）
 * - 展开最外层 .container 包装（避免双层容器嵌套）
 */
function cleanArticleHTML(html: string): string {
  // 移除 script 标签
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  // 移除 canvas 标签
  cleaned = cleaned.replace(/<canvas[\s\S]*?<\/canvas>/gi, "");
  // 展开最外层 .container
  cleaned = cleaned.replace(
    /<div\s+class\s*=\s*["'][^"']*\bcontainer\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    "$1"
  );
  return cleaned.trim();
}

// ========== 组件 ==========

export default function PostClientWrapper({
  slug,
  postTitle,
  postDescription,
}: PostClientWrapperProps) {
  const [html, setHtml] = useState<string>("");
  const [scopedStyles, setScopedStyles] = useState<string>("");
  const [toc, setToc] = useState<TocItem[]>([
    { id: "article-content", title: "正文内容", level: 1 },
    { id: "comments-section", title: "留言区", level: 1 },
  ]);
  const activeId = useActiveToc(toc);

  useEffect(() => {
    fetch(`/content/${slug}/index.html`)
      .then((res) => res.text())
      .then((text) => {
        // 提取文章样式并作用域化
        const styleMatch = text.match(/<style[^>]*>([\s\S]*)<\/style>/i);
        if (styleMatch) {
          const scoped = scopeArticleStyles(styleMatch[1]);
          setScopedStyles(scoped);
        }

        // 提取 body 内容并清理
        const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : text;
        const cleaned = cleanArticleHTML(bodyContent);

        // 给 h2、h3 标签添加 id，以便 TOC 锚点跳转
        const parser = new DOMParser();
        const doc = parser.parseFromString(cleaned, "text/html");
        doc.querySelectorAll("h2, h3").forEach((heading) => {
          const title = heading.textContent || "";
          const id = title.replace(/\s+/g, "-").toLowerCase();
          heading.id = id;
        });
        setHtml(doc.body.innerHTML);

        // 解析目录
        const h2Matches = cleaned.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
        const parsedToc: TocItem[] = [];
        for (const match of h2Matches) {
          const title = match[1].replace(/<[^>]*>/g, "");
          const id = title.replace(/\s+/g, "-").toLowerCase();
          parsedToc.push({ id, title, level: 1 });
        }
        if (parsedToc.length > 0) {
          setToc([...parsedToc, { id: "comments-section", title: "留言区", level: 1 }]);
        }
      });
  }, [slug]);

  // ========== 纳音矩阵：hover 悬浮弹窗（事件委托版） ==========
  // ⚠️ 必须用事件委托：不能用 forEach 给每个 cell 绑 addEventListener，
  //    因为 PostClientWrapper 会在滚动时因 useActiveToc 触发重渲染，
  //    dangerouslySetInnerHTML 的 DOM 节点会被重建，旧监听器丢失。
  //    改为在 document 上绑 mousemove（持久存在），用 closest() 找到目标 cell。
  useEffect(() => {
    if (!html) return;

    const timer = setTimeout(() => {
      const cells = document.querySelectorAll('.jz-cell[data-detail]');
      if (cells.length === 0) return;
      if (document.getElementById('nayin-popover')) return;

      // ── 创建 fixed 弹窗（挂载 body，不受 overflow 裁剪）──
      const pop = document.createElement('div');
      pop.id = 'nayin-popover';
      Object.assign(pop.style, {
        position: 'fixed',
        zIndex: '9999',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
        transform: 'translateY(4px)',
        maxWidth: '340px',
        width: 'max-content',
      });
      pop.innerHTML = [
        '<div style="background:linear-gradient(135deg,#1a1920 0%,#22232b 100%);border:1px solid rgba(212,168,83,0.25);border-radius:12px;padding:14px 16px;box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.03) inset;pointer-events:auto">',
        '  <div id="np-title" style="font-weight:700;font-size:1em;margin-bottom:4px"></div>',
        '  <div id="np-pair" style="font-size:0.82em;color:#888;margin-bottom:8px;letter-spacing:0.08em"></div>',
        '  <div id="np-quote" style="border-left:2px solid #d4a853;background:rgba(212,168,83,0.04);padding:6px 10px;border-radius:0 6px 6px 0;color:#aaa;font-style:italic;line-height:1.7;font-size:0.87em;margin-bottom:8px"></div>',
        '  <div id="np-text" style="color:#bbb;line-height:1.75;font-size:0.9em"></div>',
        '</div>'
      ].join('\n');
      document.body.appendChild(pop);

      const titleEl = document.getElementById('np-title')!;
      const pairEl = document.getElementById('np-pair')!;
      const quoteEl = document.getElementById('np-quote')!;
      const textEl = document.getElementById('np-text')!;

      let hideTimer: ReturnType<typeof setTimeout> | null = null;
      let currentCell: HTMLElement | null = null;  // 追踪当前悬浮的 cell

      // ── 填充弹窗内容并定位 ──
      let prevCell: HTMLElement | null = null;  // 上一个悬浮的cell（用于恢复样式）
      const showAt = (cell: HTMLElement) => {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        if (currentCell === cell && pop.style.opacity === '1') return;  // 同一 cell 不重复刷新

        // 恢复前一个cell的原始样式（切换单元格时）
        if (prevCell && prevCell !== cell) {
          prevCell.style.background = '';
          prevCell.style.color = '';
        }
        prevCell = cell;

        currentCell = cell;

        // ★ 黑底高亮当前单元格（JS直接控制，绕过CSS scope问题）
        cell.style.background = '#1a1a1a';
        cell.style.color = '#e8e0d0';

        try {
          const d = JSON.parse(cell.getAttribute('data-detail')!);
          const clr = (cell.getAttribute('data-color') || '#d4a853')!;
          titleEl.textContent = d.title || '';
          titleEl.style.color = clr;
          pairEl.textContent = d.pair || '';
          quoteEl.textContent = d.quote || '';
          quoteEl.style.borderLeftColor = clr;
          textEl.innerHTML = d.text || '';
          Array.from(textEl.querySelectorAll('strong')).forEach((s: HTMLElement) => {
            s.style.color = clr;
          });
        } catch (_e) { /* ignore */ }

        const rect = cell.getBoundingClientRect();
        const gap = 8;
        // 先设可见以测量真实尺寸
        pop.style.visibility = 'hidden';
        pop.style.opacity = '1';
        pop.style.transform = 'translateY(0)';
        pop.style.pointerEvents = 'auto';

        const popRect = pop.getBoundingClientRect();
        const popW = popRect.width || 340;
        const popH = popRect.height || 220;

        let left = rect.left + rect.width / 2 - popW / 2;
        let top = rect.bottom + gap;

        // 边界修正
        if (left < 8) left = 8;
        if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
        if (top + popH > window.innerHeight - 20) {
          top = rect.top - popH - gap;
        }
        if (top < 8) top = 8;

        pop.style.left = left + 'px';
        pop.style.top = top + 'px';
        pop.style.visibility = 'visible';  // 测完尺寸才真正显示（避免闪烁）
      };

      const hidePopover = () => {
        // 恢复当前cell的原始样式
        if (prevCell) {
          prevCell.style.background = '';
          prevCell.style.color = '';
          prevCell = null;
        }
        currentCell = null;
        hideTimer = setTimeout(() => {
          pop.style.opacity = '0';
          pop.style.transform = 'translateY(4px)';
          pop.style.pointerEvents = 'none';
          hideTimer = null;
        }, 100);
      };

      // ═══════════ 事件委托：在 document 上监听（永远不丢） ═══════════
      document.addEventListener('mousemove', onMouseMove, true);  // capture 阶段
      document.addEventListener('touchstart', onTouchStart, { passive: true });

      function onMouseMove(e: MouseEvent) {
        const cell = (e.target as HTMLElement).closest('.jz-cell[data-detail]') as HTMLElement | null;
        if (cell) {
          showAt(cell);
        } else {
          // 鼠标不在任何 cell 上，检查是否离开了弹窗本身
          const popInner = pop.firstElementChild;
          if (popInner && popInner.contains(e.target as Node)) {
            // 在弹窗内部 → 保持显示
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          } else if (pop.style.opacity === '1') {
            // 离开了 cell 和弹窗 → 隐藏
            hidePopover();
          }
        }
      }

      function onTouchStart(e: Event) {
        const cell = (e.target as HTMLElement).closest('.jz-cell[data-detail]') as HTMLElement | null;
        if (cell) {
          e.preventDefault();
          showAt(cell);
          setTimeout(hidePopover, 3000);
        }
      }

      // cleanup
      return () => {
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('touchstart', onTouchStart);
        if (hideTimer) clearTimeout(hideTimer);
        if (prevCell) { prevCell.style.background = ''; prevCell.style.color = ''; }
        pop.remove();
      };
    }, 150);

    // 注意：外层 useEffect 的 cleanup 只负责清除 setTimeout
    return () => { clearTimeout(timer); };
  }, [html]);

  return (
    <div className="flex-1 min-w-0 overflow-x-hidden">
      {/* 统一文章样式注入（已限定作用域） */}
      <style>{articleBaseCSS}</style>

      {/* 文章自定义样式（经过作用域化处理，不会泄漏到外部组件） */}
      {scopedStyles && <style dangerouslySetInnerHTML={{ __html: scopedStyles }} />}

      <article
        id="article-content"
        className="article-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex items-center justify-between mt-8 px-4 py-3 bg-[#12121a]/50 rounded-xl border border-[rgba(212,168,83,0.08)]">
        <span className="text-sm text-[#aaaaaa]">
          如果觉得有帮助，可以打赏支持作者
        </span>
        <DonationModal postSlug={slug} postTitle={postTitle} />
      </div>

      <Comments postSlug={slug} />
    </div>
  );
}

export { useActiveToc } from "@/components/Sidebar";

// ========== 统一文章基础样式 ==========
const articleBaseCSS = `
/* 文章内容统一样式框架 */
.article-content {
  color: #e8e6e3;
  line-height: 1.9;
  font-size: 1.05rem;
  max-width: 100%;
  overflow-x: hidden;
}

/* 标题层级 */
.article-content h1 {
  font-size: 2.2em;
  font-weight: 700;
  color: #ffffff;
  margin: 1.5em 0 0.8em;
  padding-bottom: 0.3em;
  border-bottom: 2px solid rgba(212,168,83,0.2);
  line-height: 1.3;
}

.article-content h1:first-child {
  margin-top: 0;
}

.article-content h2 {
  font-size: 1.5em;
  font-weight: 700;
  color: #d4a853;
  margin: 2em 0 1em;
  padding-left: 0.6em;
  border-left: 3px solid #d4a853;
  line-height: 1.4;
}

.article-content h3 {
  font-size: 1.2em;
  font-weight: 600;
  color: #e0c878;
  margin: 1.5em 0 0.8em;
  line-height: 1.4;
}

.article-content h4 {
  font-size: 1.05em;
  font-weight: 600;
  color: #cccccc;
  margin: 1.2em 0 0.6em;
}

/* 段落 */
.article-content p {
  margin: 0.8em 0;
  text-align: justify;
}

/* 链接 */
.article-content a {
  color: #d4a853;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.article-content a:hover {
  color: #e8c878;
}

/* 列表 */
.article-content ul, .article-content ol {
  padding-left: 1.5em;
  margin: 0.8em 0;
}
.article-content li {
  margin: 0.3em 0;
  line-height: 1.7;
}

/* 引用 */
.article-content blockquote {
  border-left: 3px solid rgba(212,168,83,0.3);
  margin: 1em 0;
  padding: 0.5em 1em;
  background: rgba(212,168,83,0.05);
  border-radius: 0 8px 8px 0;
  color: #cccccc;
}

/* 表格 */
.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95em;
}
.article-content thead {
  background: rgba(212,168,83,0.1);
}
.article-content th {
  padding: 0.7em 0.8em;
  text-align: left;
  color: #d4a853;
  font-weight: 600;
  border-bottom: 2px solid rgba(212,168,83,0.3);
  white-space: nowrap;
}
.article-content td {
  padding: 0.6em 0.8em;
  border-bottom: 1px solid rgba(212,168,83,0.08);
  vertical-align: top;
}
.article-content tr:hover td {
  background: rgba(212,168,83,0.03);
}

/* 代码 */
.article-content code {
  background: rgba(212,168,83,0.1);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  color: #e8c878;
}
.article-content pre {
  background: rgba(10,10,15,0.8);
  border: 1px solid rgba(212,168,83,0.15);
  border-radius: 12px;
  padding: 1em;
  overflow-x: auto;
  margin: 1em 0;
}
.article-content pre code {
  background: none;
  padding: 0;
  color: #e8e6e3;
}

/* 分割线 */
.article-content hr {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,168,83,0.2), transparent);
  margin: 2em 0;
}

/* 图片 */
.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 1em 0;
}

/* 强调 */
.article-content strong {
  color: #ffffff;
  font-weight: 600;
}

/* 小屏幕适配 */
@media (max-width: 640px) {
  .article-content {
    font-size: 1rem;
  }
  .article-content h1 { font-size: 1.6em; }
  .article-content h2 { font-size: 1.3em; }
  .article-content h3 { font-size: 1.1em; }
}
`;

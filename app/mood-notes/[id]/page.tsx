"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { colors, fonts, fontSizes } from "@/lib/theme";

const MOOD_OPTIONS = [
  { key: "happy", label: "\uD83D\uDE0A 开心", value: "happy" },
  { key: "sad", label: "\uD83D\uDE22 难过", value: "sad" },
  { key: "angry", label: "\uD83D\uDE20 生气", value: "angry" },
  { key: "anxious", label: "\uD83D\uDE30 焦虑", value: "anxious" },
  { key: "calm", label: "\uD83D\uDE0C 平静", value: "calm" },
  { key: "excited", label: "\uD83E\uDD29 兴奋", value: "excited" },
  { key: "tired", label: "\uD83D\uDE34 疲惫", value: "tired" },
];

function execFormat(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

export default function MoodNoteEditor() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const noteId = params?.id as string;
  const isNew = !noteId || noteId === "new";

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [savedMsg, setSavedMsg] = useState("");
  // 标记是否已完成数据加载（用于控制编辑器初始化时机）
  const [dataLoaded, setDataLoaded] = useState(isNew);

  // 加载已有笔记
  useEffect(() => {
    if (isNew || !noteId || noteId === "new") return;
    if (status === "loading") return;
    if (!session) return;

    fetch(`/api/mood-notes/${noteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setTitle(data.title || "");
        setContent(data.content || "");
        setMood(data.mood || "");
        // 标记数据已加载，触发编辑器渲染
        setDataLoaded(true);
        setLoading(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isNew, noteId, session, status]);

  // 粘贴纯文本处理
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    function onPaste(e: ClipboardEvent) {
      e.preventDefault();
      const text = e.clipboardData?.getData("text/plain") || "";
      document.execCommand("insertText", false, text);
    }
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, []);

  async function handleSave() {
    const htmlContent = editorRef.current?.innerHTML || "";
    if (!title.trim()) {
      setSavedMsg("请输入标题");
      setTimeout(() => setSavedMsg(""), 2000);
      return;
    }
    if (!htmlContent.trim()) {
      setSavedMsg("\u8BF7\u8F93\u5165\u5185\u5BB9");
      setTimeout(() => setSavedMsg(""), 2000);
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? "/api/mood-notes" : `/api/mood-notes/${noteId}`;
      const method = isNew ? "POST" : "PUT";
      const body: Record<string, any> = { title: title.trim(), content: htmlContent, mood };
      if (!isNew && noteId && noteId !== "new") body.id = noteId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedMsg(isNew ? "\u2705 \u521B\u5EFA\u6210\u529F\uFF01" : "\u2705 \u4FDD\u5B58\u6210\u529F\uFF01");
        if (isNew && data.id) {
          setTimeout(() => router.push(`/mood-notes/${data.id}`), 800);
        }
      } else {
        setSavedMsg("\u274C " + (data.error || "\u4FDD\u5B58\u5931\u8D25"));
      }
    } catch {
      setSavedMsg("\u274C 网络错误");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 2500);
  }

  async function handleDelete() {
    if (isNew || !noteId || noteId === "new") return;
    if (!confirm("\u786E\u5B9A\u5220\u9664\u8FC9\u7BC7\u7B14\u8BB0\u5417\uFF1F")) return;
    try {
      const res = await fetch(`/api/mood-notes/${noteId}`, { method: "DELETE" });
      if (res.ok) router.push("/mood-notes");
      else alert("删除失败");
    } catch {
      alert("网络错误");
    }
  }

  // 未登录或加载中
  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-[#d4a853] text-lg animate-pulse">{loading ? "\u52A0\u8F7D\u4E2D..." : "\u8BF7\u5148\u767B\u5555"}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/mood-notes"
          className="text-sm text-[#888] hover:text-[#d4a853] transition-colors"
        >
          &larr; ← 返回列表
        </Link>
        <h1 className={`${fonts.heading} text-2xl font-bold`} style={{ color: "#d4a853" }}>
          {isNew ? "写新笔记" : "编辑笔记"}
        </h1>
      </div>

      {/* 标题输入 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题..."
        maxLength={200}
        className="w-full bg-transparent border-b-2 border-transparent focus:border-[#d4a853] outline-none pb-3 mb-6 text-2xl font-bold placeholder:text-[#444]"
        style={{ color: "#e8e6e3" }}
      />

      {/* 工具栏 */}
      <div
        className="flex flex-wrap gap-1 p-2 rounded-lg mb-4"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,168,83,0.12)" }}
      >
        {[
          { cmd: "bold", label: "B", hint: "粗体" },
          { cmd: "italic", label: "I", hint: "斜体" },
          { cmd: "underline", label: "U", hint: "下划线" },
          { type: "sep" },
          { cmd: "formatBlock", label: "H1", val: "h1", hint: "标题1" },
          { cmd: "formatBlock", label: "H2", val: "h2", hint: "标题2" },
          { type: "sep" },
          { cmd: "insertUnorderedList", label: "\u2022 \u5217\u8868", hint: "无序列表" },
          { cmd: "insertOrderedList", label: "1. \u5217\u8868", hint: "有序列表" },
        ].map((btn, i) =>
          btn.type === "sep" ? (
            <span key={i} className="w-px h-6 mx-1 bg-[rgba(212,168,83,0.2)]" />
          ) : (
            <button
              key={i}
              type="button"
              title={btn.hint}
              onClick={() => execFormat(btn.cmd!, btn.val)}
              className="px-2.5 py-1.5 rounded text-sm font-medium transition-all hover:bg-[rgba(212,168,83,0.15)] active:scale-95"
              style={{ color: "#bbb" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#d4a853")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#bbb")}
            >
              {btn.label!}
            </button>
          )
        )}
      </div>

      {/* 编辑器区域 - 用key确保数据加载后重新挂载并注入内容 */}
      <div
        key={dataLoaded ? "loaded" : "loading"}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="开始写下你的想法..."
        className="min-h-[400px] p-5 rounded-xl outline-none"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,168,83,0.08)",
          color: "#e8e6e3",
        }}
        dangerouslySetInnerHTML={dataLoaded && content ? { __html: content } : undefined}
      />

      {/* 情绪选择 + 操作按钮 */}
      <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setMood(mood === opt.value ? "" : opt.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                mood === opt.value
                  ? "ring-2 ring-[#d4a853]"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={
                mood === opt.value
                  ? { background: "rgba(212,168,83,0.2)", color: "#d4a853" }
                  : { background: "rgba(255,255,255,0.04)", color: "#aaa" }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-sm animate-pulse" style={{
              color: savedMsg.includes("\u2705") ? "#5cb85c" : "#d9534f",
            }}>
              {savedMsg}
            </span>
          )}
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg text-sm border border-red-900 text-red-400 hover:bg-red-950/20 transition-all"
            >
              🗑️ 删除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              background: saving
                ? "#333"
                : "linear-gradient(90deg,#d4a853,#b8860b)",
              color: "#0a0a0f",
            }}
          >
            {saving ? "保存中..." : isNew ? "创建笔记" : "保存修改"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { colors, fonts, fontSizes } from "@/lib/theme";

const MOOD_OPTIONS = [
  { key: "happy", label: "😊 开心", value: "happy" },
  { key: "sad", label: "😢 难过", value: "sad" },
  { key: "angry", label: "😠 生气", value: "angry" },
  { key: "anxious", label: "😰 焦虑", value: "anxious" },
  { key: "calm", label: "😌 平静", value: "calm" },
  { key: "excited", label: "🤩 兴奋", value: "excited" },
  { key: "tired", label: "😴 疒惫", value: "tired" },
];

function execFormat(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

// 确认弹窗组件
function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  danger,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <>
      {/* 背景遮罩 */}
      <div
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100 }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: "#16161d", border: `1px solid ${danger ? "rgba(220,53,69,0.3)" : "rgba(212,168,83,0.25)"}`,
        borderRadius: 14, padding: "24px 28px", minWidth: 340, zIndex: 101,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: danger ? "#d9534f" : "#e8e6e3", marginBottom: 10 }}>
          {title}
        </h3>
        <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, margin: "0 0 22px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {cancelText && (
            <button onClick={onCancel} style={{
              padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent", color: "#999", fontSize: 13, cursor: "pointer",
            }}>
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm} style={{
            padding: "8px 22px", borderRadius: 8, border: "none",
            background: danger
              ? "linear-gradient(135deg, #dc3545, #c82333)"
              : "linear-gradient(135deg, #d4a853, #b8860b)",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
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
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [savedMsg, setSavedMsg] = useState("");
  const [dataLoaded, setDataLoaded] = useState(isNew);

  // 弹窗状态
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 加载已有笔记
  useEffect(() => {
    if (isNew || !noteId || noteId === "new") return;
    if (status === "loading") return;

    fetch(`/api/mood-notes/${noteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setTitle(data.title || "");
        setContent(data.content || "");
        setMood(data.mood || "");
        setIsPublic(data.isPublic || false);
        setDataLoaded(true);
        setLoading(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isNew, noteId, status]);

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
    if (!title.trim()) { setSavedMsg("请输入标题"); setTimeout(() => setSavedMsg(""), 2000); return; }
    if (!htmlContent.trim()) { setSavedMsg("请输入内容"); setTimeout(() => setSavedMsg(""), 2000); return; }

    setSaving(true);
    try {
      const url = isNew ? "/api/mood-notes" : `/api/mood-notes/${noteId}`;
      const method = isNew ? "POST" : "PUT";
      const body: Record<string, any> = { title: title.trim(), content: htmlContent, mood, isPublic };
      if (!isNew && noteId && noteId !== "new") body.id = noteId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedMsg(isNew ? "✅ 创建成功！" : "✅ 保存成功！");
        if (isNew && data.id) {
          setTimeout(() => router.push(`/mood-notes/${data.id}`), 800);
        }
      } else {
        setSavedMsg("❌ " + (data.error || "保存失败"));
      }
    } catch {
      setSavedMsg("❌ 网络错误");
    }
    setSaving(false);
    setTimeout(() => setSavedMsg(""), 2500);
  }

  // 分享到平台（带二次确认）
  async function handleTogglePublic() {
    if (!noteId || noteId === "new") return;
    try {
      const res = await fetch(`/api/mood-notes/${noteId}/toggle-public`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsPublic(data.isPublic);
        setSavedMsg(data.isPublic
          ? "✅ 已分享到平台"
          : "✅ 已取消分享");
      } else {
        setSavedMsg("❌ " + (data.error || "操作失败"));
      }
    } catch { setSavedMsg("❌ 网络错误"); }
    setTimeout(() => setSavedMsg(""), 2500);
  }

  async function handleDelete() {
    if (isNew || !noteId || noteId === "new") return;
    try {
      const res = await fetch(`/api/mood-notes/${noteId}`, { method: "DELETE" });
      if (res.ok) router.push("/mood-notes");
      else alert("删除失败");
    } catch { alert("网络错误"); }
    setShowDeleteConfirm(false);
  }

  // 未登录或加载中
  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-[#d4a853] text-lg animate-pulse">{loading ? "加载中..." : "请先登啕"}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* 顶部导航 */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <Link href="/mood-notes" style={{
          color: "#888", fontSize: 13, textDecoration: "none",
          transition: "color 0.2s",
        }} onMouseEnter={(e) => (e.currentTarget.style.color = "#d4a853")}
           onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
          &larr; 返回列表
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#d4a853", margin: 0 }}>
          {isNew ? "写新笔记" : "编辑笔记"}
        </h1>
      </div>

      {/* 标题输入 */}
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="笔记标题..."
        maxLength={200} style={{
          width: "100%", background: "transparent", border: "none",
          borderBottom: "2px solid transparent", outline: "none",
          paddingBottom: 12, marginBottom: 16,
          fontSize: 24, fontWeight: 700, color: "#e8e6e3",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#d4a853")}
        onBlur={(e) => (e.target.style.borderColor = "transparent")}
      />

      {/* 工具栏 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 4, padding: 10, borderRadius: 10, marginBottom: 12,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,168,83,0.12)",
      }}>
        {[
          { cmd: "bold", label: "<b>B</b>", hint: "粗体" },
          { cmd: "italic", label: "<i>I</i>", hint: "斜体" },
          { cmd: "underline", label: "<u>U</u>", hint: "下划线" },
          { type: "sep" as const },
          { cmd: "formatBlock", label: "H1", val: "h1", hint: "标题1" },
          { cmd: "formatBlock", label: "H2", val: "h2", hint: "标题2" },
          { type: "sep" as const },
          { cmd: "insertUnorderedList", label: "• 列表", hint: "无序列表" },
          { cmd: "insertOrderedList", label: "1. 列表", hint: "有序列表" },
        ].map((btn, i) =>
          btn.type === "sep" ? (
            <span key={i} style={{ width: 1, height: 22, margin: "0 4px", background: "rgba(212,168,83,0.2)" }} />
          ) : (
            <button key={i} type="button" title={btn.hint}
              onClick={() => execFormat(btn.cmd!, btn.val)}
              style={{
                padding: "6px 12px", borderRadius: 6, border: "none",
                background: "none", color: "#bbb", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#d4a853"; (e.target as HTMLElement).style.background = "rgba(212,168,83,0.15)"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#bbb"; (e.target as HTMLElement).style.background = ""; }}
              dangerouslySetInnerHTML={{ __html: btn.label! }}
            />
          )
        )}
      </div>

      {/* 编辑器区域 */}
      <div
        key={dataLoaded ? "loaded" : "loading"}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="开始写下你的想法..."
        className="min-h-[300px] p-5 rounded-xl outline-none"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,168,83,0.08)",
          color: "#e8e6e3",
          lineHeight: 1.8,
        }}
        dangerouslySetInnerHTML={dataLoaded && content ? { __html: content } : undefined}
      />

      {/* 情绪选择 + 操作按钮 */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 20, flexWrap: "wrap", gap: 12,
      }}>
        {/* 情绪标签 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MOOD_OPTIONS.map((opt) => (
            <button key={opt.key} type="button"
              onClick={() => setMood(mood === opt.value ? "" : opt.value)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 13,
                border: mood === opt.value ? "1px solid #d4a853" : "1px solid rgba(255,255,255,0.06)",
                background: mood === opt.value ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)",
                color: mood === opt.value ? "#d4a853" : "#aaa",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {savedMsg && (
            <span style={{
              fontSize: 13,
              color: savedMsg.includes("✅") ? "#5cb85c" : "#d9534f",
              animation: "pulse 1s infinite",
            }}>{savedMsg}</span>
          )}

          {!isNew && (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} style={{
              padding: "9px 16px", borderRadius: 9,
              border: "1px solid rgba(220,53,69,0.3)", background: "rgba(220,53,69,0.05)",
              color: "#d9534f", fontSize: 13, cursor: "pointer",
            }}>
              🗑️ 删除
            </button>
          )}

          {/* 分享/公开切换 — 新建和编辑模式都显示 */}
          <button type="button" onClick={() => isNew ? setIsPublic(!isPublic) : setShowShareConfirm(true)} style={{
            padding: "9px 18px", borderRadius: 9,
            border: isPublic ? "1px solid rgba(92,184,92,0.3)" : "1px solid rgba(212,168,83,0.3)",
            background: isPublic ? "rgba(92,184,92,0.08)" : "rgba(212,168,83,0.08)",
            color: isPublic ? "#5cb85c" : "#d4a853",
            fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {isPublic ? "✅ 公开可见" : "🔒 仅自己可见"}
          </button>

          <button type="button" onClick={handleSave} disabled={saving} style={{
            padding: "9px 24px", borderRadius: 9, border: "none",
            background: saving ? "#333" : "linear-gradient(90deg, #d4a853, #b8860b)",
            color: "#0a0a0f", fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {saving ? "保存中..." : isNew ? "创建笔记" : "保存修改"}
          </button>
        </div>
      </div>

      {/* 确认弹窗：分享到平台 */}
      <ConfirmDialog
        open={showShareConfirm}
        title={isPublic ? "取消分享" : "分享到平台"}
        message={
          isPublic
            ? "确定要取消分享吗？取消后其他用户将无法查看这篇笔记。"
            : "确定要分享到平台吗？分享后所有登录用户均可浏览这篇笔记。"
        }
        confirmText={isPublic ? "确认取消" : "确认分享"}
        cancelText="取消"
        onConfirm={() => { setShowShareConfirm(false); handleTogglePublic(); }}
        onCancel={() => setShowShareConfirm(false)}
      />

      {/* 确认弹窗：删除 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除笔记"
        message="确定要删除这篇笔记吗？操作不可撤销。"
        confirmText="确定删除"
        cancelText="取消"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        danger
      />
    </div>
  );
}

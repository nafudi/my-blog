"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

const MOOD_OPTIONS = [
  { value: "", label: "\u65e0" },
  { value: "happy", label: "\u{1F60A} \u5f00\u5fc3" },
  { value: "sad", label: "\u{1F622} \u96be\u8fc7" },
  { value: "angry", label: "\u{1F620} \u751f\u6c14" },
  { value: "anxious", label: "\u{1F630} \u7126\u8651" },
  { value: "calm", label: "\u{1F60C} \u5e73\u9759" },
  { value: "excited", label: "\u{1F929} \u5174\u594b" },
  { value: "tired", label: "\u{1F634} \u75b2\u60b5" },
];

export default function NoteEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const noteId = params?.id as string | undefined;
  const isNew = !noteId || noteId === "new";

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Load existing note when editing
  useEffect(() => {
    if (!isNew && status === "authenticated" && noteId) {
      fetch(`/api/mood-notes/${noteId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) {
            setTitle(data.title);
            setMood(data.mood || "");
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = data.content || "";
              }
            }, 50);
          } else {
            router.push("/mood-notes");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isNew, noteId, status]);

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  // Toolbar commands
  const execCmd = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val || undefined);
    editorRef.current?.focus();
  }, []);

  // Paste handler - strip HTML for security
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const handleSave = async () => {
    const t = title.trim();
    if (!t) { alert("\u8bf7\u8f93\u5165\u6807\u9898"); return; }

    const content = editorRef.current?.innerHTML || "";
    const clean = content.trim();
    if (!clean || clean === "<br>" || clean === "<p></p>" || clean === "<p><br></p>") {
      alert("\u8bf7\u8f93\u5165\u5185\u5bb9"); return;
    }

    setSaving(true);
    try {
      const url = isNew ? "/api/mood-notes" : `/api/mood-notes/${noteId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, content: clean, mood: mood || null }),
      });
      if (res.ok) {
        router.push("/mood-notes");
      } else {
        const d = await res.json().catch(() => ({ error: "\u4fdd\u5b58\u5931\u8d25" }));
        alert(d.error || "\u4fdd\u5b58\u5931\u8d25");
      }
    } catch {
      alert("\u7f51\u7edc\u9519\u8bef");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("\u786e\u5b9a\u5220\u9664\u8fd9\u7bc7\u7b14\u8bb0\u5417\uff1f")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/mood-notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/mood-notes");
      } else {
        alert("\u5220\u9664\u5931\u8d25");
      }
    } catch {
      alert("\u7f51\u7edc\u9519\u8bef");
    } finally {
      setDeleting(false);
    }
  };

  // Loading state for auth or fetching
  if (status === "loading" || status === "unauthenticated") {
    return null;
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-[#d4a853] animate-pulse">\u52a0\u8f7d\u4e2d...</div>
      </div>
    );
  }

  const pageTitle = isNew ? "\u65b0\u5efa\u7b14\u8bb0" : "\u7f16\u8f91\u7b14\u8bb0";

  /* Toolbar button sub-component */
  function TBtn({ onClick, label, extraStyle }: { onClick: () => void; label: string; extraStyle?: string }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors hover:bg-[rgba(212,168,83,0.15)] ${extraStyle || ""}`}
        style={{ color: "#bbb" }}
      >
        {label}
      </button>
    );
  }

  function Div() {
    return <div className="w-px h-5 mx-1" style={{ background: "rgba(212,168,83,0.15)" }} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/mood-notes")}
          className="text-sm text-[#888] hover:text-[#d4a853] transition-colors flex items-center gap-1"
        >
          \u2190 \u8fd4\u56de\u5217\u8868
        </button>
        <h1 className="text-2xl font-bold" style={{ color: "#d4a853" }}>{pageTitle}</h1>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Title input */}
        <input
          type="text"
          placeholder="\u7b14\u8bb0\u6807\u9898..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-white border-b-2 pb-2 outline-none transition-colors focus:border-[#d4a853]"
          style={{ borderColor: "rgba(212,168,83,0.15)" }}
          maxLength={200}
        />

        {/* Mood selector */}
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm outline-none cursor-pointer transition-all focus:ring-2 focus:ring-[#d4a853]/50"
          style={{
            background: "rgba(18,18,26,0.8)",
            border: "1px solid rgba(212,168,83,0.15)",
            color: "#ccc",
          }}
        >
          {MOOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Rich text toolbar */}
        <div
          className="rounded-t-xl px-4 py-2.5 flex items-center gap-1 flex-wrap"
          style={{ background: "rgba(18,18,26,0.9)", border: "1px solid rgba(212,168,83,0.1)", borderBottom: "none" }}
        >
          <TBtn onClick={() => execCmd("bold")} label="B" extraStyle="font-bold" />
          <TBtn onClick={() => execCmd("italic")} label="I" extraStyle="italic" />
          <TBtn onClick={() => execCmd("underline")} label="U" extraStyle="underline" />
          <Div />
          <TBtn onClick={() => execCmd("formatBlock", "h1")} label="H1" />
          <TBtn onClick={() => execCmd("formatBlock", "h2")} label="H2" />
          <Div />
          <TBtn onClick={() => execCmd("insertUnorderedList")} label="\u2022 List" />
          <TBtn onClick={() => execCmd("insertOrderedList")} label="1. List" />
        </div>

        {/* Editor area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onPaste={handlePaste}
          data-placeholder="\u5f00\u59cb\u8bb0\u5f55\u4f60\u7684\u5fc3\u60c5..."
          className="min-h-[400px] rounded-b-xl p-5 outline-none transition-shadow focus:shadow-lg text-[#ddd] leading-relaxed"
          style={{
            background: "rgba(18,18,26,0.6)",
            border: "1px solid rgba(212,168,83,0.1)",
            borderTop: "none",
          }}
        />

        {/* Action buttons */}
        <div className="flex justify-between items-center pt-4">
          {!isNew ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-red-500/20 disabled:opacity-40"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              {deleting ? "\u5220\u9664\u4e2d..." : "\u{1F5D1} \u5220\u9664"}
            </button>
          ) : <div />}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/mood-notes")}
              className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "#aaa" }}
            >
              \u53d6\u6d88
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: "linear-gradient(135deg, #d4a853, #b8860b)",
                color: "#fff",
              }}
            >
              {saving ? "\u4fdd\u5b58\u4e2d..." : "\u{1F4BE} \u4fdd\u5b58"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

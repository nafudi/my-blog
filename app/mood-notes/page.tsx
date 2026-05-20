"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { colors, fonts, fontSizes } from "@/lib/theme";

const MOOD_MAP: Record<string, string> = {
  happy: "\uD83D\uDE0A 开心",
  sad: "\uD83D\uDE22 难过",
  angry: "\uD83D\uDE20 生气",
  anxious: "\uD83D\uDE30 焦虑",
  calm: "\uD83D\uDE0C 平静",
  excited: "\uD83E\uDD29 兴奋",
  tired: "\uD83D\uDE34 疲惫",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function MoodNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetch("/api/mood-notes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data);
        else setNotes([]);
      })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-[#d4a853] text-lg animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className={`text-3xl font-bold mb-1`} style={{ color: "#d4a853" }}>
            📝 情绪笔记
          </h1>
          <p className="text-sm text-[#888]">记录你的心情，只属于你</p>
        </div>
        <Link
          href="/mood-notes/new"
          className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #d4a853, #b8860b)",
            color: "#fff",
          }}
        >
          + 写新笔记
        </Link>
      </div>

      {/* 笔记列表 */}
      {notes.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: "rgba(212,168,83,0.25)" }}
        >
          <p className="text-4xl mb-3">📝</p>
          <p style={{ color: colors.textTertiary }} className="mb-4">
            还没有笔记
          </p>
          <p className="text-sm text-[#666] mb-6">写下第一篇情绪记录吧</p>
          <Link
            href="/mood-notes/new"
            className="inline-block px-6 py-2 rounded-lg text-sm"
            style={{ background: "rgba(212,168,83,0.15)", color: "#d4a853" }}
          >
            开始写作
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/mood-notes/${note.id}`}
              className="group block rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: colors.bgCard,
                border: "1px solid rgba(212,168,83,0.08)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,83,0.3)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,83,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <h3
                className={`${fontSizes.h4} mb-2 group-hover:text-[#d4a853] transition-colors`}
                style={{ color: colors.textPrimary }}
              >
                {note.title}
              </h3>
              <p
                className={`text-sm mb-3 ${fontSizes.bodySm} line-clamp-3`}
                style={{ color: colors.textMuted }}
              >
                {stripHtml(note.content).slice(0, 120)}
              </p>
              <div className="flex items-center justify-between">
                {note.mood && MOOD_MAP[note.mood] ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(212,168,83,0.1)",
                      color: "#d4a853",
                    }}
                  >
                    {MOOD_MAP[note.mood]}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={fontSizes.caption}
                  style={{ color: colors.textTertiary }}
                >
                  {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

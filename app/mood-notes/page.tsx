"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MoodNote {
  id: string;
  title: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
}

const MOOD_MAP: Record<string, string> = {
  happy: "\u{1F60A} \u5f00\u5fc3",
  sad: "\u{1F622} \u96be\u8fc7",
  angry: "\u{1F620} \u751f\u6c14",
  anxious: "\u{1F630} \u7126\u8651",
  calm: "\u{1F60C} \u5e73\u9759",
  excited: "\u{1F929} \u5174\u594b",
  tired: "\u{1F634} \u75b2\u60b5",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export default function MoodNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<MoodNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchNotes();
    }
  }, [status]);

  const fetchNotes = async () => {
    try {
      const res = await fetch("/api/mood-notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error("\u83b7\u53d6\u7b14\u8bb0\u5931\u8d25:", e);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-[#d4a853] text-lg animate-pulse">\u52a0\u8f7d\u4e2d...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className={`text-3xl font-bold mb-1`} style={{ color: "#d4a853" }}>
            \u{1F4DD} \u60c5\u7eea\u7b14\u8bb0
          </h1>
          <p className="text-sm text-[#888]">\u8bb0\u5f55\u4f60\u7684\u5fc3\u60c5\uff0c\u53ea\u5c5e\u4e8e\u4f60</p>
        </div>
        <Link
          href="/mood-notes/new"
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #d4a853, #b8860b)",
            color: "#fff",
          }}
        >
          + \u65b0\u5efa\u7b14\u8bb0
        </Link>
      </div>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed" style={{ borderColor: "rgba(212,168,83,0.2)", background: "rgba(18,18,26,0.6)" }}>
          <div className="text-5xl mb-4">\u{1F4D1}</div>
          <p className="text-lg text-[#aaa] mb-2">\u8fd8\u6ca1\u6709\u7b14\u8bb0</p>
          <p className="text-sm text-[#666] mb-6">\u5f00\u59cb\u8bb0\u5f55\u4f60\u7684\u5fc3\u60c5\u5427~</p>
          <Link
            href="/mood-notes/new"
            className="inline-block px-6 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{ background: "#d4a853", color: "#fff" }}
          >
            \u5199\u7b2c\u4e00\u7bc7\u7b14\u8bb0
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <Link key={note.id} href={`/mood-notes/${note.id}`}>
              <div
                className="group rounded-xl p-5 transition-all duration-300 cursor-pointer h-full flex flex-col border"
                style={{
                  background: "rgba(18,18,26,0.7)",
                  borderColor: "rgba(212,168,83,0.1)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(212,168,83,0.35)";
                  el.style.boxShadow = "0 8px 32px rgba(212,168,83,0.1)";
                  el.style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(212,168,83,0.1)";
                  el.style.boxShadow = "none";
                  el.style.transform = "translateY(0)";
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-base text-white line-clamp-1 group-hover:text-[#d4a853] transition-colors flex-1">
                    {note.title}
                  </h3>
                  {note.mood && (
                    <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(212,168,83,0.15)", color: "#d4a853" }}>
                      {MOOD_MAP[note.mood] || note.mood}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#888] line-clamp-3 flex-1 leading-relaxed">
                  {stripHtml(note.content).slice(0, 120)}
                  {stripHtml(note.content).length > 120 ? "..." : ""}
                </p>
                <div className="mt-3 pt-3 border-t text-xs text-[#555]" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {new Date(note.updatedAt).toLocaleDateString("zh-CN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

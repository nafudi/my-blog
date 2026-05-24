"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { colors, fonts, fontSizes } from "@/lib/theme";

const MOOD_MAP: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  anxious: "😰",
  calm: "😌",
  excited: "🤩",
  tired: "😴",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

interface Note {
  id: string;
  title: string;
  content: string;
  mood?: string | null;
  isPublic: boolean;
  likeCount?: number;
  collectCount?: number;
  authorName?: string;
  authorId?: string;
  isLiked?: boolean;
  isCollected?: boolean;
  collectedAt?: string;
  updatedAt: string;
  createdAt?: string;
}

type TabKey = "public" | "mine" | "collect";
type FilterType = "all" | "public" | "private";

// Toast 提示组件
function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", top: 72, left: "50%", transform: "translateX(-50%)",
      padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: "#222", border: "1px solid rgba(212,168,83,0.25)", color: "#d4a853",
      zIndex: 200, animation: "fadein 0.2s ease",
    }}>
      {msg}
    </div>
  );
}

export default function MoodNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab 状态
  const [activeTab, setActiveTab] = useState<TabKey>("public");
  const [filter, setFilter] = useState<FilterType>("all");

  // 数据状态
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [myNotes, setMyNotes] = useState<Note[]>([]);
  const [collectNotes, setCollectNotes] = useState<Note[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);
  const [loadingCollect, setLoadingCollect] = useState(false);

  // UI 状态
  const [toastMsg, setToastMsg] = useState("");
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  // 加载公开列表（不需要登录）
  useEffect(() => {
    fetch("/api/mood-notes?scope=public")
      .then((res) => res.json())
      .then((data) => setPublicNotes(Array.isArray(data) ? data : []))
      .catch(() => setPublicNotes([]))
      .finally(() => setLoadingPublic(false));
  }, []);

  // 切换到需要登录的 tab 时加载数据
  function loadTab(tab: TabKey) {
    setActiveTab(tab);
    if (!session) { router.push("/login"); return; }

    if (tab === "mine" && myNotes.length === 0) {
      setLoadingMine(true);
      fetch("/api/mood-notes")
        .then((res) => res.json())
        .then((data) => setMyNotes(Array.isArray(data) ? data : []))
        .catch(() => setMyNotes([]))
        .finally(() => setLoadingMine(false));
    }
    if (tab === "collect" && collectNotes.length === 0) {
      setLoadingCollect(true);
      fetch("/api/mood-notes?collect=mine")
        .then((res) => res.json())
        .then((data) => setCollectNotes(Array.isArray(data) ? data : []))
        .catch(() => setCollectNotes([]))
        .finally(() => setLoadingCollect(false));
    }
  }

  // 点赞操作
  async function handleLike(noteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!session) { showToast("请先登录"); router.push("/login"); return; }
    try {
      const res = await fetch(`/api/mood-notes/${noteId}/like`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // 更新本地状态
        setPublicNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, isLiked: data.liked, likeCount: data.likeCount } : n
          )
        );
        showToast(data.liked ? "已点赞，已通知作者" : "已取消点赞");
      } else {
        showToast(data.error || "操作失败");
      }
    } catch { showToast("网络错误"); }
  }

  // 收藏操作
  async function handleCollect(noteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!session) { showToast("请先登录"); router.push("/login"); return; }
    try {
      const note = publicNotes.find((n) => n.id === noteId);
      const isCurrentlyCollected = note?.isCollected || collectNotes.some((n) => n.id === noteId);

      if (isCurrentlyCollected) {
        // 取消收藏
        const res = await fetch(`/api/mood-notes/${noteId}/collect`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok) {
          setPublicNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isCollected: false, collectCount: data.collectCount } : n));
          setCollectNotes((prev) => prev.filter((n) => n.id !== noteId));
          showToast("已取消收藏");
        }
      } else {
        // 新增收藏
        const res = await fetch(`/api/mood-notes/${noteId}/collect`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          setPublicNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isCollected: true, collectCount: data.collectCount } : n));
          showToast("已加入收藏夹");
        } else if (res.status === 409) {
          showToast("已经收藏过了");
        }
      }
    } catch { showToast("网络错误"); }
  }

  // 作者菜单操作
  async function handleAuthorAction(targetUserId: string, action: "block" | "priority") {
    if (!session) { showToast("请先登录"); router.push("/login"); return; }
    try {
      const res = await fetch("/api/mood-notes/pref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await res.json();
      if (res.ok || res.status === 201) {
        showToast(data.message || (action === "block" ? "已屏蔽该作者" : "已优先显示该作者"));
        // 如果是屏蔽，从列表中移除
        if (action === "block") {
          setPublicNotes((prev) => prev.filter((n) => n.authorId !== targetUserId));
        }
        // 如果是优先，将该作者的帖子排到最前
        if (action === "priority") {
          setPublicNotes((prev) => {
            const target = prev.filter((n) => n.authorId === targetUserId);
            const rest = prev.filter((n) => n.authorId !== targetUserId);
            return [...target, ...rest];
          });
        }
      } else {
        showToast(data.error || "操作失败");
      }
    } catch { showToast("网络错误"); }
    setMenuOpenFor(null);
  }

  // Toast
  let toastTimer: NodeJS.Timeout;
  function showToast(msg: string) {
    setToastMsg(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToastMsg(""), 2500);
  }

  // 渲染帖子卡片（公开浏览用）
  function renderPostCard(note: Note, showActions = true) {
    return (
      <Link key={note.id} href={`/mood-notes/${note.id}`}
        className="group flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl transition-all duration-200"
        style={{
          background: colors.bgCard,
          border: "1px solid rgba(212,168,83,0.06)",
          textDecoration: "none", color: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.18)";
          (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.06)";
          (e.currentTarget as HTMLElement).style.transform = "";
        }}>
        {/* 情绪 emoji */}
        <span style={{ fontSize: 20, width: 32, textAlign: "center", flexShrink: 0 }}>
          {note.mood ? (MOOD_MAP[note.mood]?.split(" ")[0] || "📝") : "📝"}
        </span>

        {/* 信息区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 标题行 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{
              color: colors.textPrimary,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontWeight: 500, fontSize: 14,
            }}>
              {note.title}
            </span>
            {(activeTab === "mine" || activeTab === "public") && note.isPublic && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(92,184,92,0.12)", color: "#5cb85c", border: "1px solid rgba(92,184,92,0.2)", whiteSpace: "nowrap", flexShrink: 0 }}>
                {activeTab === "mine" ? "已分享" : "公开"}
              </span>
            )}
            {activeTab === "mine" && !note.isPublic && (
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(150,150,150,0.08)", color: "#777", border: "1px solid rgba(150,150,150,0.15)", whiteSpace: "nowrap", flexShrink: 0 }}>
                私密
              </span>
            )}
          </div>
          {/* 预览 */}
          <p style={{
            fontSize: 12, color: colors.textMuted,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0,
          }}>
            {stripHtml(note.content || "").slice(0, 100)}
          </p>
          {/* 收藏来源 */}
          {activeTab === "collect" && note.authorName && (
            <p style={{ fontSize: 11, color: "#555", marginTop: 3 }}>
              收藏自 @{note.authorName} · {new Date(note.collectedAt || "").toLocaleDateString("zh-CN")}
            </p>
          )}
        </div>

        {/* 右侧：作者/日期/操作 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {/* 作者名（仅公开 Tab 显示） */}
          {activeTab === "public" && note.authorName && (
            <div style={{ position: "relative" }}>
              <span
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenFor(menuOpenFor === note.id ? null : note.id); }}
                style={{ fontSize: 11, color: "#777", cursor: "pointer", padding: "2px 6px", borderRadius: 4, transition: "all 0.15s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#d4a853"; (e.target as HTMLElement).style.background = "rgba(212,168,83,0.08)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#777"; (e.target as HTMLElement).style.background = ""; }}
              >
                @{note.authorName}
              </span>

              {/* 作者操作菜单 */}
              {menuOpenFor === note.id && (
                <>
                  {/* 背景遮罩 */}
                  <div onClick={() => setMenuOpenFor(null)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                    background: "#16161d", border: "1px solid rgba(212,168,83,0.2)", borderRadius: 10,
                    padding: "4px 0", minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    zIndex: 50, animation: "fadeUp 0.15s ease",
                  }}>
                    <p style={{ fontSize: 10, color: "#555", padding: "5px 16px 2px", letterSpacing: 1 }}>作者操作</p>
                    <button onClick={() => handleAuthorAction(note.authorId!, "priority")} style={menuItemStyle}>
                      ⬆️ 优先看他的文章
                    </button>
                    <button onClick={() => handleAuthorAction(note.authorId!, "block")} style={{ ...menuItemStyle, color: "#d9534f" }}
                      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(220,53,69,0.1)"; }}
                      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = ""; }}>
                      🚫 不再看他的文章
                    </button>
                    <div style={{ height: 1, background: "rgba(212,168,83,0.08)", margin: "4px 0" }} />
                    <button onClick={() => setMenuOpenFor(null)} style={menuItemStyle}>取消</button>
                  </div>
                  <style>{`@keyframes fadeUp{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
                </>
              )}
            </div>
          )}

          <span style={{ fontSize: 12, color: "#555" }}>
            {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
          </span>

          {/* 点赞/收藏按钮（仅公开 Tab 且有权限时显示） */}
          {showActions && activeTab === "public" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={(e) => handleLike(note.id, e)}
                style={{
                  display: "flex", alignItems: "center", gap: 3, padding: "3px 9px",
                  borderRadius: 14, border: `1px solid ${note.isLiked ? "rgba(255,107,129,0.35)" : "rgba(255,255,255,0.06)"}`,
                  background: note.isLiked ? "rgba(255,107,129,0.06)" : "transparent",
                  color: note.isLiked ? "#ff6b81" : "#666", fontSize: 11, cursor: "pointer", transition: "all 0.15s",
                }}>
                {note.isLiked ? "❤️" : "💙"} <span>{note.likeCount || 0}</span>
              </button>
              <button
                onClick={(e) => handleCollect(note.id, e)}
                style={{
                  display: "flex", alignItems: "center", gap: 3, padding: "3px 9px",
                  borderRadius: 14, border: `1px solid ${(note.isCollected || collectNotes.find(n=>n.id===note.id)) ? "rgba(212,168,83,0.35)" : "rgba(255,255,255,0.06)"}`,
                  background: (note.isCollected || collectNotes.find(n=>n.id===note.id)) ? "rgba(212,168,83,0.06)" : "transparent",
                  color: (note.isCollected || collectNotes.find(n=>n.id===note.id)) ? "#d4a853" : "#666", fontSize: 11, cursor: "pointer", transition: "all 0.15s",
                }}>
                {(note.isCollected || collectNotes.find(n=>n.id===note.id)) ? "⭐" : "☆"}
                <span>{note.collectCount || 0}</span>
              </button>
            </div>
          )}

          {/* 我的收藏中的取消收藏按钮 */}
          {showActions && activeTab === "collect" && (
            <button
              onClick={(e) => { e.preventDefault(); handleCollect(note.id, e); }}
              style={{
                padding: "3px 10px", borderRadius: 14,
                border: "1px solid rgba(212,168,83,0.3)", background: "rgba(212,168,83,0.06)",
                color: "#d4a853", fontSize: 11, cursor: "pointer",
              }}>
              已收藏
            </button>
          )}
        </div>
      </Link>
    );
  }

  // 获取当前数据
  const currentData = activeTab === "public" ? publicNotes :
                      activeTab === "mine" ? myNotes.filter((n) => {
                        if (filter === "all") return true;
                        if (filter === "public") return n.isPublic;
                        return !n.isPublic;
                      }) : collectNotes;

  const isLoading = activeTab === "public" ? loadingPublic :
                    activeTab === "mine" ? loadingMine :
                    loadingCollect;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <Toast msg={toastMsg} />

      {/* 标题栏 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#d4a853" }}>📝 情绪笔记</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 3 }}>记录你的心情，分享你的感悟</p>
        </div>
        {status !== "loading" && session && (
          <Link href="/mood-notes/new" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 10, textDecoration: "none",
            background: "linear-gradient(135deg, #d4a853, #b8860b)", color: "#fff",
            fontSize: 13, fontWeight: 600, transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
          >
            + 写新笔记
          </Link>
        )}
      </div>

      {/* 三 Tab */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(212,168,83,0.12)", marginBottom: 16 }}>
        {[
          { key: "public" as TabKey, label: "🌎 公开浏览", icon: "" },
          { key: "mine" as TabKey, label: "👤 我的笔记", icon: "" },
          { key: "collect" as TabKey, label: "⭐ 我的收藏", icon: "" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => loadTab(tab.key)}
            style={{
              position: "relative", padding: "10px 18px", fontSize: 14,
              color: activeTab === tab.key ? "#d4a853" : "#888",
              background: "none", border: "none", cursor: "pointer",
              fontWeight: activeTab === tab.key ? 600 : 400, transition: "color 0.2s",
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span style={{
                position: "absolute", bottom: -1, left: 16, right: 16,
                height: 2, background: "#d4a853", borderRadius: 1,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* 我的笔记筛选 */}
      {activeTab === "mine" && (
        <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
          {([
            { key: "all" as FilterType, label: "全部" },
            { key: "public" as FilterType, label: "🌎 已公开" },
            { key: "private" as FilterType, label: "🔒 仅自己" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "4px 13px", borderRadius: 20, fontSize: 12,
                border: `1px solid ${filter === f.key ? "#d4a853" : "rgba(212,168,83,0.12)"}`,
                background: filter === f.key ? "rgba(212,168,83,0.12)" : "transparent",
                color: filter === f.key ? "#d4a853" : "#aaa", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* 内容区 */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ color: "#d4a853", fontSize: 17, animation: "pulse 1s infinite" }}>加载中...</div>
        </div>
      ) : currentData.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          border: "2px dashed rgba(212,168,83,0.2)", borderRadius: 16,
        }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>{activeTab === "public" ? "📝" : "📋"}</p>
          <p style={{ color: "#666", fontSize: 14, marginBottom: 6 }}>
            {activeTab === "public" ? "还没有公开的笔记" :
             activeTab === "mine" ? "还没有笔记" : "还没有收藏任何笔记"}
          </p>
          <p style={{ color: "#444", fontSize: 12 }}>
            {activeTab === "public" ? "等待用户分享精彩内容..." :
             activeTab === "mine" ? "写下第一篇情绪记录吧" : "浏览公开页面收藏感兴趣的笔记吧"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {currentData.map((note) => renderPostCard(note))}
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, width: "100%",
  padding: "8px 16px", fontSize: 13, border: "none", background: "none",
  color: "#ccc", cursor: "pointer", transition: "all 0.1s", textAlign: "left" };

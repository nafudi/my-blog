"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { colors, fontSizes } from "@/lib/theme";

// 登录提示弹窗
function LoginPrompt({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        background: "#16161d", border: "1px solid rgba(212,168,83,0.25)",
        borderRadius: 16, padding: "32px 28px", minWidth: 360, zIndex: 101,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)", textAlign: "center",
      }}>
        <p style={{ fontSize: 36, marginBottom: 14 }}>👤</p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e8e6e3", marginBottom: 10 }}>我的后台</h2>
        <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.7, margin: "0 0 24px" }}>
          登录后可以查看你的数据统计、修改昵称等功能
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => signIn()}
            style={{
              padding: "10px 28px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #d4a853, #b8860b)",
              color: "#0a0a0f", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            登录
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "10px 22px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "#999", fontSize: 14, cursor: "pointer",
            }}
          >
            取消
          </button>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nameEditing, setNameEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // 未登录 → 显示登录弹窗（从侧边栏点进来时）
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setShowLoginPrompt(true);
    }
  }, [session, status]);

  // 加载统计数据
  useEffect(() => {
    if (status === "loading" || !session) return;
    fetch("/api/user/stats")
      .then((res) => res.json())
      .then((data) => setUserStats(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [session, status]);

  async function handleSaveName() {
    if (newName.trim().length < 1) { setNameMsg("昵称不能为空"); setTimeout(() => setNameMsg(""), 2000); return; }
    setSavingName(true);
    try {
      const res = await fetch("/api/user/name", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameMsg("✅ 更新成功");
        setNameEditing(false);
        if (userStats) setUserStats({ ...userStats, user: { ...userStats.user, name: data.name } });
      } else {
        setNameMsg("❌ " + (data.error || "失败"));
      }
    } catch { setNameMsg("❌ 网络错误"); }
    setSavingName(false);
    setTimeout(() => setNameMsg(""), 2500);
  }

  // 未登录时
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div style={{ color: "#d4a853", fontSize: 17 }} className="animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!session && showLoginPrompt) {
    return (
      <div className="min-h-[60vh]">
        <LoginPrompt onClose={() => router.push("/")} />
      </div>
    );
  }

  if (!session) return null;

  const stats = userStats?.stats;
  const user = userStats?.user;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* 标题 */}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#d4a853", marginBottom: 24 }}>
        👤 我的后台
      </h1>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#d4a853" }} className="animate-pulse">加载中...</div>
      ) : !userStats ? (
        <div style={{ textAlign: "center", padding: 48, border: "2px dashed rgba(212,168,83,0.2)", borderRadius: 16, color: "#666" }}>
          加载数据失败
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ===== 基本信息卡片 ===== */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,168,83,0.08)",
            borderRadius: 14, padding: "22px 26px",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#d4a853", marginBottom: 16 }}>
              🏳 基本信息
            </h3>

            {/* 头像 + 昵称 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, #d4a853, #b8860b)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, color: "#0a0a0f", fontWeight: 700,
              }}>
                {user?.name ? user.name[0].toUpperCase() : "?"}
              </div>

              <div style={{ flex: 1 }}>
                {nameEditing ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                      maxLength={8}
                      autoFocus
                      style={{
                        flex: 1, padding: "6px 12px", borderRadius: 8, border: "1px solid #d4a853",
                        background: "rgba(255,255,255,0.05)", color: "#e8e6e3", fontSize: 14, outline: "none",
                      }}
                    />
                    <button onClick={handleSaveName}
                      disabled={savingName}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        background: savingName ? "#333" : "#d4a853", color: "#0a0a0f",
                        fontSize: 12, fontWeight: 600, cursor: savingName ? "not-allowed" : "pointer",
                      }}>
                      {savingName ? "保存..." : "确认"}
                    </button>
                    <button onClick={() => setNameEditing(false)}
                      style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer" }}>
                      取消
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: "#e8e6e3" }}>{user?.name || "匿名"}</span>
                    <button onClick={() => { setNewName(user?.name || ""); setNameEditing(true); }}
                      style={{ fontSize: 11, color: "#888", cursor: "pointer", padding: "2px 6px", borderRadius: 4, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "#d4a853"; }}
                      onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "#888"; }}>
                      ✏️ 修改
                    </button>
                  </div>
                )}
                {nameMsg && <span style={{ fontSize: 12, marginLeft: 4, color: nameMsg.includes("✅") ? "#5cb85c" : "#d9534f" }}>{nameMsg}</span>}
              </div>
            </div>

            {/* 邮箱 + 注册时间 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: "#555" }}>📧 邮箱</span><br/>
                <span style={{ color: "#aaa" }}>{user?.email || "-"}</span>
              </div>
              <div>
                <span style={{ color: "#555" }}>🗕 注册时间</span><br/>
                <span style={{ color: "#aaa" }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-CN") : "-"}</span>
              </div>
            </div>
          </div>

          {/* ===== 数据统计卡片 ===== */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,168,83,0.08)",
            borderRadius: 14, padding: "22px 26px",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#d4a853", marginBottom: 16 }}>
              📊 数据统计
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
              {[
                { icon: "📝", label: "发布笔记", value: stats?.noteCount ?? 0, color: "#d4a853" },
                { icon: "🌎", label: "公开笔记", value: stats?.publicNoteCount ?? 0, color: "#5cb85c" },
                { icon: "❤️", label: "获得点赞", value: stats?.likeCount ?? 0, color: "#ff6b81" },
                { icon: "⭐", label: "被收藏", value: stats?.collectCount ?? 0, color: "#f0c14b" },
              ].map((stat) => (
                <div key={stat.label} style={{
                  textAlign: "center", padding: "16px 10px",
                  background: "rgba(255,255,255,0.01)", borderRadius: 10, border: `1px solid ${stat.color}15`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== 快捷入口 ===== */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,168,83,0.08)",
            borderRadius: 14, padding: "22px 26px",
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#d4a853", marginBottom: 14 }}>
              ⚡ 快捷入口
            </h3>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "+ 写新笔记", href: "/mood-notes/new", gradient: "linear-gradient(135deg,#d4a853,#b8860b)" },
                { label: "📝 我的笔记", href: "/mood-notes", bg: "rgba(212,168,83,0.1)" },
                { label: "⭐ 我的收藏", href: "/mood-notes", bg: "rgba(240,193,75,0.08)" },
                { label: "🌎 公开浏览", href: "/mood-notes", bg: "rgba(92,184,92,0.06)" },
              ].map((link) => (
                <Link key={link.label} href={link.href}
                  style={{
                    padding: "10px 20px", borderRadius: 10, textDecoration: "none",
                    ...(link.gradient
                      ? { background: link.gradient, color: "#0a0a0f", fontWeight: 600 }
                      : { background: link.bg, color: "#ccc", border: "1px solid rgba(255,255,255,0.06)" }),
                    fontSize: 13, transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!link.gradient) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,168,83,0.3)"; (e.currentTarget as HTMLElement).style.color = "#d4a853"; } else (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                  onMouseLeave={(e) => { if (!link.gradient) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#ccc"; } else (e.currentTarget as HTMLElement).style.transform = ""; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

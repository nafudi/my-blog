"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  passwordPlain: string | null;
  credits: number;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  author: { name: string | null; email: string } | null;
  post: { title: string; slug: string } | null;
  postSlug?: string;
}

interface Donation {
  id: string;
  amount: number;
  message: string | null;
  payMethod: string | null;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"comment" | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // 积分管理
  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);

  // 兑换码批量生成
  const [genCount, setGenCount] = useState("");
  const [genCredits, setGenCredits] = useState("20");
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [creditResult, setCreditResult] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/comments").then((r) => r.json()),
      fetch("/api/admin/donations").then((r) => r.json()),
      fetch("/api/admin/online").then((r) => r.json()),
    ]).then(([sessionData, u, c, d, o]) => {
      const adminEmails = ["841428951@qq.com"];
      if (!sessionData?.user?.email || !adminEmails.includes(sessionData.user.email)) {
        router.push("/login");
        return;
      }
      setUsers(u);
      setComments(c);
      setDonations(d);
      setOnlineCount(o?.online ?? 0);
      setLoading(false);
    });
  }, [router]);

  // 在线人数定时刷新（30秒）
  useEffect(() => {
    const timer = setInterval(() => {
      fetch("/api/admin/online").then(r => r.json()).then(o => setOnlineCount(o?.online ?? 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  async function handleDelete(id: string, type: "comment") {
    if (!confirm("确定删除？")) return;
    setDeletingId(id);
    setDeleteType(type);
    await fetch(`/api/admin/${type}s?id=${id}`, { method: "DELETE" });
    if (type === "comment") {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
    setDeletingId(null);
    setDeleteType(null);
  }

  // 审核通过（发布）
  async function handleApprove(id: string) {
    setApprovingId(id);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "approved" } : c))
        );
      }
    } catch (err) {
      console.error("审核失败:", err);
    } finally {
      setApprovingId(null);
    }
  }

  function formatAmount(fen: number): string {
    return `¥${(fen / 100).toFixed(2)}`;
  }

  async function handleAddCredits() {
    if (!creditUserId || !creditAmount) return;
    const amt = Number(creditAmount);
    if (isNaN(amt) || amt === 0 || Math.abs(amt) > 10000) { setCreditResult("积分数额需在 -10000~10000 之间（负数为扣减）"); return; }
    setCreditLoading(true);
    setCreditResult(null);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: creditUserId, amount: amt, reason: creditReason || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setCreditResult("成功！用户 " + (data.user?.email || creditUserId) + " 积分已" + (amt > 0 ? "增加" : "扣减") + "，当前余额：" + data.newBalance);
        try { window.dispatchEvent(new Event('credits:changed')); } catch(_) {}
        setUsers(prev => prev.map(u => u.id === creditUserId ? { ...u, credits: data.newBalance } : u));
        setCreditAmount("");
        setCreditReason("");
      } else {
        setCreditResult(data.error || "操作失败");
      }
    } catch { setCreditResult("网络错误"); }
    setCreditLoading(false);
  }


  async function handleGenCodes() {
    const cnt = Number(genCount) || 0;
    const crd = Number(genCredits) || 0;
    if (cnt < 1 || cnt > 1000) { setGenResult("数量需在 1~1000 之间"); return; }
    if (crd < 1 || crd > 10000) { setGenResult("积分需在 1~10000 之间"); return; }
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/admin/redemption-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: cnt, credits: crd }),
      });
      const data = await res.json();
      if (data.ok) {
        const previewStr = (data.preview || []).slice(0, 20).join("  ");
        const extra = data.generated > 20 ? " ... 共 " + data.generated + " 个" : "";
        setGenResult("✅ 成功生成 " + data.generated + " 个兑换码（每码 " + data.creditsPerCode + " 积分） | " + previewStr + extra);
        setGenCount("");
      } else {
        setGenResult("❌ " + (data.error || "未知错误"));
      }
    } catch { setGenResult("❌ 网络错误"); }
    setGenLoading(false);
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#d4a853] text-2xl font-[var(--font-ma-shan)] mb-2">加载中...</div>
          <div className="w-48 h-1 bg-[rgba(212,168,83,0.1)] rounded-full overflow-hidden">
            <div className="h-full bg-[#d4a853] rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  const totalFen = donations.reduce((sum, d) => sum + d.amount, 0);
  const pendingCount = comments.filter(c => c.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-[var(--font-ma-shan)] text-[#d4a853]">管理后台</h1>
          <Link href="/" className="text-[#9a9590] hover:text-[#d4a853] text-sm">← 返回首页</Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">注册用户</p>
            <p className="text-2xl text-[#d4a853] font-bold">{users.length}</p>
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">评论数</p>
            <p className="text-2xl text-[#d4a853] font-bold">{comments.length}</p>
            {pendingCount > 0 && <p className="text-xs text-yellow-400 mt-1">{pendingCount} 待审核</p>}
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">打赏数</p>
            <p className="text-2xl text-[#d4a853] font-bold">{donations.length}</p>
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">打赏总额</p>
            <p className="text-2xl text-[#d4a853] font-bold">{formatAmount(totalFen)}</p>
          </div>
          <div className="bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.2)] rounded-xl p-4 text-center">
            <p className="text-[#22c55e] text-xs mb-1">✅ 在线人数</p>
            <p className="text-2xl text-[#22c55e] font-bold">{onlineCount}</p>
          </div>
        </div>

        {/* 用户列表 */}
        <section className="mb-10">
          <h2 className="text-xl text-[#d4a853] mb-4 font-[var(--font-ma-shan)]">用户列表</h2>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(212,168,83,0.1)]">
                  <th className="text-left p-3 text-[#9a9590] font-normal">ID</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">昵称</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">邮箱</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">明文密码</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-3 text-[#555] whitespace-nowrap">{u.id}</td>
                    <td className="p-3 text-[#e8e6e3] whitespace-nowrap">{u.name || "-"}</td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{u.email}</td>
                    <td className="p-3 font-mono text-[#f59e0b] whitespace-nowrap max-w-[120px] truncate" title={u.passwordPlain || ""}>
                      {u.passwordPlain || <span className="text-[#555]">无</span>}
                    </td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{new Date(u.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-[#555]">暂无用户</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 评论管理 */}
        <section className="mb-10">
          <h2 className="text-xl text-[#d4a853] mb-4 font-[var(--font-ma-shan)]">评论管理</h2>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-[rgba(212,168,83,0.1)]">
                  <th className="text-left p-3 text-[#9a9590] font-normal">用户</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">邮箱</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">文章</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">状态</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">内容</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">时间</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-3 text-[#d4a853] whitespace-nowrap">{c.author?.name || "匿名"}</td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{c.author?.email || "-"}</td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap max-w-[160px] truncate" title={c.post?.title || c.postSlug || ""}>
                      {c.post?.title || c.postSlug || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {c.status === "approved" ? (
                        <span className="text-green-400 text-xs">✅ 已发布</span>
                      ) : (
                        <span className="text-yellow-400 text-xs">⏳ 待审核</span>
                      )}
                    </td>
                    <td className="p-3 text-[#e8e6e3] max-w-[250px]">
                      <span className="line-clamp-2" title={c.content}>{c.content}</span>
                    </td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{new Date(c.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="p-3 whitespace-nowrap flex items-center gap-2">
                      {c.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(c.id)}
                          disabled={approvingId === c.id}
                          className="px-2 py-1 rounded text-xs font-medium transition-all disabled:opacity-40"
                          style={{ background: "linear-gradient(90deg,#d4a853,#a67c3d)", color: "#0a0a0f" }}
                        >
                          {approvingId === c.id ? "发布中..." : "发 布"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id, "comment")}
                        disabled={deletingId === c.id}
                        className="text-red-400 hover:text-red-300 text-xs disabled:opacity-40"
                      >
                        {deletingId === c.id ? "删除中..." : "删除"}
                      </button>
                    </td>
                  </tr>
                ))}
                {comments.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-[#555]">暂无评论</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 打赏记录 */}
        <section>
          <h2 className="text-xl text-[#d4a853] mb-4 font-[var(--font-ma-shan)]">打赏记录</h2>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[rgba(212,168,83,0.1)]">
                  <th className="text-left p-3 text-[#9a9590] font-normal">用户</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">邮箱</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">金额</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">留言</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">方式</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">状态</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">时间</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="p-3 text-[#e8e6e3] whitespace-nowrap">{d.user?.name || "-"}</td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{d.user?.email || "-"}</td>
                    <td className="p-3 text-[#d4a853] font-semibold whitespace-nowrap">{formatAmount(d.amount)}</td>
                    <td className="p-3 text-[#9a9590] max-w-[180px]">
                      <span className="line-clamp-1" title={d.message || ""}>{d.message || "-"}</span>
                    </td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">
                      {d.payMethod === "alipay" ? "支付宝" : d.payMethod === "wechat" ? "微信" : "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {d.status === "paid" ? (
                        <span className="text-green-400 text-xs">已支付</span>
                      ) : d.status === "pending" ? (
                        <span className="text-yellow-400 text-xs">待支付</span>
                      ) : (
                        <span className="text-red-400 text-xs">失败</span>
                      )}
                    </td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{new Date(d.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-[#555]">暂无打赏</td></tr>
                )}
              </tbody>
            </table>
          </div>

        {/* ===== 积分管理 ===== */}
        <section>
          <h2 className="text-xl text-[#d4a853] mb-4 font-[var(--font-ma-shan)]">积分管理</h2>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-5">
            <p className="text-xs text-[#555] mb-4">手动给用户增加或扣减积分（填正数增加，填负数扣减）</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <input value={creditUserId} onChange={e => setCreditUserId(e.target.value)}
                placeholder="用户ID" className="bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.3)]" />
              <input type="number" min="-10000" max="10000" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                placeholder="积分数量（正增/负减）" className="bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.3)]" />
              <input value={creditReason} onChange={e => setCreditReason(e.target.value)}
                placeholder="原因（可选）" className="bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.3)]" />
              <button onClick={handleAddCredits} disabled={creditLoading || !creditUserId || !creditAmount}
                className="py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(90deg,#d4a853,#a67c3d)", color: "#0a0a0f", cursor: creditLoading ? "not-allowed" : "pointer" }}>
                {creditLoading ? "处理中..." : (Number(creditAmount) < 0 ? "- 扣减积分" : "+ 发放积分")}
              </button>
            </div>

            {creditResult && (
              <div className={"text-sm p-3 rounded-lg " + (creditResult.includes("成功") ? "bg-[rgba(92,184,92,0.1)] text-[#5cb85c]" : "bg-[rgba(217,83,79,0.1)] text-[#d9534f]")}>
                {creditResult}
              </div>
            )}

            {/* 用户快速选择表 */}
            <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)]">
              <p className="text-xs text-[#555] mb-2">点击用户ID快速填入：</p>
              <div className="flex flex-wrap gap-2">
                {users.map(u => (
                  <button key={u.id} onClick={() => setCreditUserId(u.id)}
                    className="px-2.5 py-1 rounded-md text-xs transition-colors hover:bg-[rgba(212,168,83,0.12)] border border-[rgba(255,255,255,0.04)]"
                    style={{ color: "#9a9590" }}>
                    <span className="font-medium text-[#d4a853]">{u.email}</span>{" "}
                    <span className="text-[#555]">({u.credits ?? "?"}分)</span>
                    {" "} <span className="text-[#444] scale-90 inline-block">{u.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* ===== 兑换码管理 ===== */}
        <section>
          <h2 className="text-xl text-[#d4a853] mb-4 font-[var(--font-ma-shan)]">兑换码管理</h2>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-5">
            <p className="text-xs text-[#555] mb-4">批量生成兑换码（12位随机码，自动去重，一人一码用过即废）</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-[#555] block mb-1">生成数量 (1~1000)</label>
                <input type="number" min="1" max="1000" value={genCount} onChange={e => setGenCount(e.target.value)}
                  placeholder="例如：100"
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.3)]" />
              </div>
              <div>
                <label className="text-xs text-[#555] block mb-1">每码积分 (1~10000)</label>
                <input type="number" min="1" max="10000" value={genCredits} onChange={e => setGenCredits(e.target.value)}
                  placeholder="默认：20"
                  className="w-full bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-[#e8e6e3] outline-none focus:border-[rgba(212,168,83,0.3)]" />
              </div>
              <div className="flex items-end">
                <button onClick={handleGenCodes} disabled={genLoading || !genCount}
                  className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: genLoading ? "#333" : "linear-gradient(90deg,#d4a853,#a67c3d)", color: "#0a0a0f", cursor: (!genLoading && genCount) ? "pointer" : "not-allowed" }}>
                  {genLoading ? "生成中..." : "🎫 批量生成兑换码"}
                </button>
              </div>
            </div>

            {genResult && (
              <div className={"text-sm p-3 rounded-lg whitespace-pre-wrap break-all font-mono " + (genResult.includes("✅") ? "bg-[rgba(92,184,92,0.08)] text-[#5cb85c]" : "bg-[rgba(217,83,79,0.08)] text-[#d9534f]")}>
                {genResult}
              </div>
            )}
          </div>
        </section>
</section>

      </div>
    </div>
  );
}

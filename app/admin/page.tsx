"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  passwordPlain: string | null;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
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

interface City {
  id: string;
  province: string;
  city: string;
  longitude: number;
  timezone: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"comment" | null>(null);
  // 省市经度表新增表单
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newLongitude, setNewLongitude] = useState("");
  const [initMsg, setInitMsg] = useState("");
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/comments").then((r) => r.json()),
      fetch("/api/admin/donations").then((r) => r.json()),
      fetch("/api/admin/cities").then((r) => r.json()),
    ]).then(([sessionData, u, c, d, ct]) => {
      const adminEmails = ["841428951@qq.com"];
      if (!sessionData?.user?.email || !adminEmails.includes(sessionData.user.email)) {
        router.push("/login");
        return;
      }
      setUsers(u);
      setComments(c);
      setDonations(d);
      setCities(ct || []);
      setLoading(false);
    });
  }, [router]);

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

  async function handleInitCities() {
    if (!confirm("初始化将添加全部省市经度数据（已存在则跳过），确定继续？")) return;
    setInitMsg("初始化中...");
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init" }),
    }).then((r) => r.json());
    setInitMsg(`完成！新增 ${res.count} 条记录`);
    // 重新加载城市列表
    const citiesData = await fetch("/api/admin/cities").then((r) => r.json());
    setCities(citiesData || []);
    setTimeout(() => setInitMsg(""), 3000);
  }

  async function handleAddCity(e: React.FormEvent) {
    e.preventDefault();
    if (!newProvince || !newCity || !newLongitude) {
      setAddMsg("请填写完整信息");
      return;
    }
    const lon = parseFloat(newLongitude);
    if (isNaN(lon) || lon < 70 || lon > 135) {
      setAddMsg("经度需在 70~135 之间");
      return;
    }
    setAddMsg("添加中...");
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", province: newProvince, city: newCity, longitude: lon }),
    }).then((r) => r.json());
    if (res.error) {
      setAddMsg("添加失败: " + res.error);
    } else {
      setAddMsg("添加成功！");
      setNewProvince("");
      setNewCity("");
      setNewLongitude("");
      const citiesData = await fetch("/api/admin/cities").then((r) => r.json());
      setCities(citiesData || []);
    }
    setTimeout(() => setAddMsg(""), 3000);
  }

  async function handleDeleteCity(id: string) {
    if (!confirm("确定删除该城市？")) return;
    await fetch(`/api/admin/cities?id=${id}`, { method: "DELETE" });
    setCities((prev) => prev.filter((c) => c.id !== id));
  }

  function formatAmount(fen: number): string {
    return `¥${(fen / 100).toFixed(2)}`;
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-[var(--font-ma-shan)] text-[#d4a853]">管理后台</h1>
          <Link href="/" className="text-[#9a9590] hover:text-[#d4a853] text-sm">← 返回首页</Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">注册用户</p>
            <p className="text-2xl text-[#d4a853] font-bold">{users.length}</p>
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">评论数</p>
            <p className="text-2xl text-[#d4a853] font-bold">{comments.length}</p>
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">打赏数</p>
            <p className="text-2xl text-[#d4a853] font-bold">{donations.length}</p>
          </div>
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl p-4 text-center">
            <p className="text-[#9a9590] text-xs mb-1">打赏总额</p>
            <p className="text-2xl text-[#d4a853] font-bold">{formatAmount(totalFen)}</p>
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
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-[rgba(212,168,83,0.1)]">
                  <th className="text-left p-3 text-[#9a9590] font-normal">用户</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">邮箱</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">文章</th>
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
                    <td className="p-3 text-[#e8e6e3] max-w-[250px]">
                      <span className="line-clamp-2" title={c.content}>{c.content}</span>
                    </td>
                    <td className="p-3 text-[#9a9590] whitespace-nowrap">{new Date(c.createdAt).toLocaleString("zh-CN")}</td>
                    <td className="p-3 whitespace-nowrap">
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
                  <tr><td colSpan={6} className="p-6 text-center text-[#555]">暂无评论</td></tr>
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
        </section>

        {/* 省市经度表 */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-[#d4a853] font-[var(--font-ma-shan)]">省市经度表 <span className="text-xs text-[#9a9590] font-normal">（真太阳时计算用）</span></h2>
            <div className="flex gap-3">
              <button
                onClick={handleInitCities}
                className="px-3 py-1.5 text-xs bg-[rgba(212,168,83,0.15)] hover:bg-[rgba(212,168,83,0.25)] text-[#d4a853] rounded-lg border border-[rgba(212,168,83,0.3)] transition-colors"
              >
                初始化全国数据
              </button>
              {initMsg && <span className="text-xs text-[#9a9590] self-center">{initMsg}</span>}
            </div>
          </div>

          {/* 新增表单 */}
          <form onSubmit={handleAddCity} className="flex flex-wrap gap-2 mb-4 p-3 bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl">
            <input
              type="text"
              placeholder="省份"
              value={newProvince}
              onChange={(e) => setNewProvince(e.target.value)}
              className="flex-1 min-w-[100px] px-3 py-1.5 bg-[#0a0a0f] border border-[rgba(212,168,83,0.2)] rounded-lg text-[#e8e6e3] text-sm placeholder-[#555] focus:outline-none focus:border-[#d4a853]"
            />
            <input
              type="text"
              placeholder="城市"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              className="flex-1 min-w-[100px] px-3 py-1.5 bg-[#0a0a0f] border border-[rgba(212,168,83,0.2)] rounded-lg text-[#e8e6e3] text-sm placeholder-[#555] focus:outline-none focus:border-[#d4a853]"
            />
            <input
              type="number"
              step="0.01"
              placeholder="经度（如 116.4）"
              value={newLongitude}
              onChange={(e) => setNewLongitude(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-1.5 bg-[#0a0a0f] border border-[rgba(212,168,83,0.2)] rounded-lg text-[#e8e6e3] text-sm placeholder-[#555] focus:outline-none focus:border-[#d4a853]"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#d4a853] hover:bg-[#c49843] text-[#0a0a0f] text-sm font-semibold rounded-lg transition-colors"
            >
              添加
            </button>
            {addMsg && <span className="w-full text-xs text-[#9a9590]">{addMsg}</span>}
          </form>

          {/* 城市列表 */}
          <div className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-[rgba(212,168,83,0.1)]">
                  <th className="text-left p-3 text-[#9a9590] font-normal">省份</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">城市</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">经度（度）</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">时差（分钟）</th>
                  <th className="text-left p-3 text-[#9a9590] font-normal">操作</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city) => {
                  const diff = ((city.longitude - 120) * 4).toFixed(1);
                  return (
                    <tr key={city.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="p-3 text-[#9a9590] whitespace-nowrap">{city.province}</td>
                      <td className="p-3 text-[#e8e6e3] whitespace-nowrap">{city.city}</td>
                      <td className="p-3 text-[#d4a853] font-mono whitespace-nowrap">{city.longitude.toFixed(2)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {Number(diff) > 0 ? (
                          <span className="text-red-400 text-xs">+{diff} 分钟（早）</span>
                        ) : Number(diff) < 0 ? (
                          <span className="text-blue-400 text-xs">{diff} 分钟（晚）</span>
                        ) : (
                          <span className="text-[#555] text-xs">0 分钟</span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteCity(city.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cities.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-[#555]">暂无数据，点击「初始化全国数据」批量添加</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

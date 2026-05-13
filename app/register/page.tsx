"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码长度至少 6 位");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    setLoading(false);

    if (res.ok) {
      router.push("/login?registered=1");
    } else {
      const data = await res.json();
      setError(data.error || "注册失败，请重试");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-ma-shan)] text-4xl text-[#d4a853]">
              易理
            </h1>
            <p className="text-[#9a9590] mt-2">注册新账号</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#12121a] border border-[rgba(212,168,83,0.12)] rounded-2xl p-8"
          >
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-[#9a9590] mb-1.5">昵称（可选）</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.1)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors"
                placeholder="您的昵称"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#9a9590] mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.1)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#9a9590] mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.1)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors"
                placeholder="至少 6 位密码"
                required
                minLength={6}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-[#9a9590] mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.1)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors"
                placeholder="再次输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "注册中..." : "注  册"}
            </button>
          </form>

          <p className="text-center text-sm text-[#555] mt-6">
            已有账号？
            <Link href="/login" className="text-[#d4a853] hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

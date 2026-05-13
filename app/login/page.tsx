"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("邮箱或密码错误，请重试");
    } else {
      router.push("/");
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
            <p className="text-[#9a9590] mt-2">登录您的账号</p>
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

            <div className="mb-6">
              <label className="block text-sm text-[#9a9590] mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.1)] text-[#e8e6e3] placeholder-[#555] focus:outline-none focus:border-[#d4a853] transition-colors"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "登录中..." : "登  录"}
            </button>
          </form>

          <p className="text-center text-sm text-[#555] mt-6">
            还没有账号？
            <Link href="/register" className="text-[#d4a853] hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

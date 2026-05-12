"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface DonationModalProps {
  postSlug: string;
  postTitle: string;
}

// 预设金额（单位：元，前端显示用）
const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export default function DonationModal({ postSlug, postTitle }: DonationModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");
  const [payMethod, setPayMethod] = useState<"alipay" | "wechat">("wechat");
  const [step, setStep] = useState<"select" | "paying" | "done">("select");
  const [loading, setLoading] = useState(false);

  // 打开弹窗
  const handleOpen = () => {
    if (!session) return;
    setOpen(true);
    setStep("select");
    setAmount(10);
    setMessage("");
  };

  // 提交打赏记录并跳转到支付
  const handleSubmit = async () => {
    if (amount < 1) return;

    setLoading(true);

    // 1. 先创建打赏记录
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postSlug,
        amount: amount * 100, // 转换为分
        message,
        payMethod,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setStep("paying");
      // 实际支付：后期接入支付宝/微信 API 时，
      // 这里会调用支付接口获取二维码或跳转支付页面
      // 目前模拟等待 2 秒后显示"完成"
      setTimeout(() => setStep("done"), 2000);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={handleOpen}
        disabled={!session}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          session
            ? "bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)]"
            : "bg-[rgba(212,168,83,0.08)] text-[#555] cursor-not-allowed"
        }`}
        title={session ? "赞赏作者" : "请先登录"}
      >
        <span>☕ 打赏</span>
      </button>

      {/* 弹窗遮罩 + 内容 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative bg-[#12121a] border border-[rgba(212,168,83,0.15)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ zIndex: 51 }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-[#555] hover:text-[#e8e6e3] transition-colors"
            >
              ✕
            </button>

            {/* 标题 */}
            <h3 className="font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-1">
              感谢您的支持
            </h3>
            <p className="text-xs text-[#555] mb-5">
              正在为「{postTitle}」打赏
            </p>

            {/* 步骤 1: 选择金额和支付方式 */}
            {step === "select" && (
              <>
                {/* 预设金额 */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {PRESET_AMOUNTS.map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-lg text-center font-semibold text-sm transition-all ${
                        amount === val
                          ? "bg-[#d4a853] text-[#0a0a0f]"
                          : "bg-[#1a1a2e] text-[#9a9590] hover:bg-[rgba(212,168,83,0.12)] hover:text-[#e8e6e3]"
                      }`}
                    >
                      ¥{val}
                    </button>
                  ))}
                </div>

                {/* 自定义金额 */}
                <div className="mb-4">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.12)] text-[#e8e6e3] focus:outline-none focus:border-[#d4a853]"
                    placeholder="自定义金额（元）"
                  />
                </div>

                {/* 支付方式选择 */}
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => setPayMethod("wechat")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      payMethod === "wechat"
                        ? "bg-[#07C160]/15 border border-[#07C160] text-[#07C160]"
                        : "bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-[#9a9590]"
                    }`}
                  >
                    <span>💚</span> 微信支付
                  </button>
                  <button
                    onClick={() => setPayMethod("alipay")}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      payMethod === "alipay"
                        ? "bg-[#1677FF]/15 border border-[#1677FF] text-[#1677FF]"
                        : "bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-[#9a9590]"
                    }`}
                  >
                    <span>🔵</span> 支付宝
                  </button>
                </div>

                {/* 留言 */}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="给作者留句话（可选）"
                  maxLength={100}
                  className="w-full px-4 py-2 mb-4 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.08)] text-[#e8e6e3] placeholder-[#555] text-sm focus:outline-none focus:border-[#d4a853]"
                />

                {/* 确认按钮 */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || amount < 1}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {loading ? "提交中..." : `确认打赏 ¥${amount}`}
                </button>

                <p className="text-xs text-[#444] mt-3 text-center">
                  ⏳ 支付接口预留 · 后期接入支付宝商户后即可使用真实支付
                </p>
              </>
            )}

            {/* 步骤 2: 支付中（模拟） */}
            {step === "paying" && (
              <div className="py-8 text-center">
                <div
                  className="inline-block w-16 h-16 border-t-[#d4a853] border-transparent rounded-full animate-spin mb-4"
                  style={{ borderWidth: "3px", borderTopColor: "#d4a853", borderStyle: "solid" }}
                />
                <p className="text-[#9a9590]">正在调起{payMethod === "alipay" ? "支付宝" : "微信"}支付...</p>
              </div>
            )}

            {/* 步骤 3: 完成 */}
            {step === "done" && (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-[family-name:var(--font-ma-shan)] text-xl text-[#d4a853] mb-1">感谢支持</p>
                <p className="text-sm text-[#9a9590]">
                  您已打赏 ¥{amount}，心意已收到
                </p>
                {message && (
                  <p className="text-xs text-[#555] mt-2 italic">
                    「{message}」
                  </p>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="mt-6 px-6 py-2 rounded-full bg-[rgba(212,168,83,0.12)] text-[#d4a853] text-sm hover:bg-[rgba(212,168,83,0.18)] transition-colors"
                >
                  关闭
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}

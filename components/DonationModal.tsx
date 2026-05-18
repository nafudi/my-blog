"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface DonationModalProps {
  postSlug?: string;
  postTitle?: string;
  mode?: "donate" | "recharge";
  onCreditsChanged?: () => void;
}

const RECHARGE_OPTIONS = [
  { label: "5 元", value: 500, credits: 10 },
  { label: "10 元", value: 1000, credits: 20 },
  { label: "20 元", value: 2000, credits: 40 },
  { label: "50 元", value: 5000, credits: 100 },
];

export default function DonationModal({
  postSlug = "",
  postTitle = "站内打赏",
  mode = "recharge",
  onCreditsChanged,
}: DonationModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"alipay" | "wechat">("alipay");
  const [step, setStep] = useState<"select" | "qrcode" | "confirming" | "done">("select");
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [result, setResult] = useState<{ addedCredits: number; newBalance: number } | null>(null);

  const handleOpen = () => {
    if (!session) return;
    setOpen(true);
    setStep("select");
    setResult(null);
  };

  const qrImage = payMethod === "wechat" ? "/donations/wechat.jpg" : "/donations/alipay.jpg";
  const qrLabel = payMethod === "wechat" ? "微信" : "支付宝";
  const qrColor = payMethod === "wechat" ? "#07C160" : "#1677FF";

  // 确认已付款 → 调用后端发积分
  const handleConfirmPay = async () => {
    setStep("confirming");
    try {
      const res = await fetch("/api/donations/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ addedCredits: data.addedCredits, newBalance: data.newBalance });
        setStep("done");
        onCreditsChanged?.();
        // 刷新导航栏积分
        const w = window as unknown as Record<string, () => void>;
        if (typeof w.__refreshNavbarCredits === "function") {
          w.__refreshNavbarCredits();
        }
      } else {
        alert(data.error || "操作失败");
        setStep("qrcode");
      }
    } catch {
      alert("网络错误，请重试");
      setStep("qrcode");
    }
  };

  // 触发按钮
  const trigger =
    mode === "recharge" ? (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)]"
      >
        <span>💰 打赏</span>
      </button>
    ) : (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)]"
        title="赞赏作者"
      >
        <span>☕ 打赏</span>
      </button>
    );

  return (
    <>
      {trigger}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-[#12121a] border border-[rgba(212,168,83,0.15)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              style={{ zIndex: 51 }}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 text-[#555] hover:text-[#e8e6e3] transition-colors"
              >
                ✕
              </button>
              <h3 className={`font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-1`}>
                感谢您的支持
              </h3>
              <p className="text-xs text-[#555] mb-5">
                {mode === "recharge" ? "打赏获取积分" : `为「${postTitle}」打赏`}
              </p>

              {/* ===== select：选择金额+支付方式 ===== */}
              {step === "select" && (
                <>
                  {mode === "recharge" && (
                    <>
                      <p className="text-sm text-[#9a9590] mb-3">选择打赏金额</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {RECHARGE_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setSelectedAmount(opt.value)}
                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                              selectedAmount === opt.value
                                ? "bg-[rgba(212,168,83,0.2)] border-[#d4a853] text-[#d4a853]"
                                : "bg-[#1a1a2e] border-[rgba(255,255,255,0.06)] text-[#9a9590] hover:border-[rgba(212,168,83,0.3)]"
                            } border`}
                          >
                            <div>{opt.label}</div>
                            <div className="text-xs opacity-70">→ {opt.credits} 积分</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-sm text-[#9a9590] mb-4">选择支付方式</p>
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setPayMethod("alipay")}
                      className="flex-1 py-4 rounded-xl flex flex-col items-center gap-2 text-sm font-medium transition-all bg-[#1677FF]/10 border border-[#1677FF] text-[#1677FF]"
                    >
                      <span className="text-3xl">🔵</span>
                      <span>支付宝</span>
                    </button>
                    <button
                      onClick={() => setPayMethod("wechat")}
                      className="flex-1 py-4 rounded-xl flex flex-col items-center gap-2 text-sm font-medium transition-all bg-[#07C160]/10 border border-[#07C160] text-[#07C160]"
                    >
                      <span className="text-3xl">💚</span>
                      <span>微信支付</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#555] text-center">
                    {mode === "recharge"
                      ? `扫码打赏 ¥${selectedAmount / 100}，到账 ${Math.floor(selectedAmount / 100) * 2} 积分`
                      : "扫码支付，金额随意 ❤️"}
                  </p>
                </>
              )}

              {/* ===== qrcode：显示二维码 ===== */}
              {step === "qrcode" && (
                <div className="text-center">
                  <p className="text-sm text-[#9a9590] mb-4">
                    请使用<span style={{ color: qrColor }}>{qrLabel}</span>扫码{mode === "recharge" ? "打赏" : "支付"}
                    {mode === "recharge" && (
                      <span className="ml-1 text-[#d4a853] font-semibold">
                        ¥{selectedAmount / 100}
                      </span>
                    )}
                  </p>
                  <div
                    className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden border-2"
                    style={{ borderColor: qrColor }}
                  >
                    <Image
                      src={qrImage}
                      alt={`${qrLabel}支付二维码`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="text-sm text-[#9a9590] mb-1">
                    {mode === "recharge" ? `金额：¥${selectedAmount / 100}` : "金额随意，扫码即付"}
                  </p>
                  <p className="text-xs text-[#d4a853] mt-2 mb-4" style={{ lineHeight: 1.5 }}>
                    💡 {mode === "recharge" ? "打赏后请联系站长确认到账（自动回传开发中）" : "感谢您的支持 ❤️"}
                  </p>
                  <button
                    onClick={() => setStep("select")}
                    className="w-full py-3 rounded-lg bg-[#1a1a2e] text-[#9a9590] text-sm hover:text-[#e8e6e3] transition-colors"
                  >
                    返回
                  </button>
                </div>
              )}

              {/* ===== confirming：处理中 ===== */}
              {step === "confirming" && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4 animate-pulse">⏳</div>
                  <p className="text-[#d4a853] font-medium">正在确认支付...</p>
                </div>
              )}

              {/* ===== done：完成 ===== */}
              {step === "done" && result && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className={`font-[family-name:var(--font-ma-shan)] text-xl text-[#d4a853] mb-2`}>
                    {mode === "recharge" ? "打赏成功！" : "感谢支持"}
                  </p>
                  {mode === "recharge" && (
                    <p className="text-sm text-[#9a9590] mb-1">
                      获得 <span className="text-[#d4a853] font-semibold">{result.addedCredits}</span> 积分
                    </p>
                  )}
                  <p className="text-xs text-[#555] mb-4">
                    当前余额：<span className="text-[#d4a853]">{result.newBalance}</span> 积分
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="px-8 py-2 rounded-full bg-[rgba(212,168,83,0.12)] text-[#d4a853] text-sm hover:bg-[rgba(212,168,83,0.18)] transition-colors"
                  >
                    关闭
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface DonationModalProps {
  postSlug: string;
  postTitle: string;
}

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

export default function DonationModal({ postSlug, postTitle }: DonationModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [message, setMessage] = useState("");
  const [payMethod, setPayMethod] = useState<"alipay" | "wechat">("wechat");
  const [step, setStep] = useState<"select" | "qrcode" | "done">("select");
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    if (!session) return;
    setOpen(true);
    setStep("select");
    setAmount(10);
    setMessage("");
  };

  const handleSubmit = async () => {
    if (amount < 1) return;
    setLoading(true);
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postSlug, amount: amount * 100, message, payMethod }),
    });
    setLoading(false);
    if (res.ok) setStep("qrcode");
  };

  const qrImage = payMethod === "wechat" ? "/donations/wechat.jpg" : "/donations/alipay.jpg";
  const qrLabel = payMethod === "wechat" ? "微信" : "支付宝";
  const qrColor = payMethod === "wechat" ? "#07C160" : "#1677FF";

  return (
    <>
      <button onClick={handleOpen} disabled={!session}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
          session ? "bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)]"
            : "bg-[rgba(212,168,83,0.08)] text-[#555] cursor-not-allowed"}`}
        title={session ? "赞赏作者" : "请先登录"}>
        <span>☕ 打赏</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-[#12121a] border border-[rgba(212,168,83,0.15)] rounded-2xl p-6 w-full max-w-sm shadow-2xl" style={{ zIndex: 51 }}>
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[#555] hover:text-[#e8e6e3] transition-colors">✕</button>
              <h3 className="font-[family-name:var(--font-ma-shan)] text-lg text-[#d4a853] mb-1">感谢您的支持</h3>
              <p className="text-xs text-[#555] mb-5">正在为「{postTitle}」打赏</p>

              {step === "select" && (
                <>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {PRESET_AMOUNTS.map((val) => (
                      <button key={val} onClick={() => setAmount(val)}
                        className={`py-2 rounded-lg text-center font-semibold text-sm transition-all ${
                          amount === val ? "bg-[#d4a853] text-[#0a0a0f]" : "bg-[#1a1a2e] text-[#9a9590] hover:bg-[rgba(212,168,83,0.12)] hover:text-[#e8e6e3]"}`}>
                        ¥{val}
                      </button>
                    ))}
                  </div>
                  <div className="mb-4">
                    <input type="number" min={1} max={10000} value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.12)] text-[#e8e6e3] focus:outline-none focus:border-[#d4a853]" placeholder="自定义金额（元）" />
                  </div>
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => setPayMethod("wechat")}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        payMethod === "wechat" ? "bg-[#07C160]/15 border border-[#07C160] text-[#07C160]" : "bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-[#9a9590]"}`}>
                      <span>💚</span> 微信
                    </button>
                    <button onClick={() => setPayMethod("alipay")}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                        payMethod === "alipay" ? "bg-[#1677FF]/15 border border-[#1677FF] text-[#1677FF]" : "bg-[#1a1a2e] border border-[rgba(255,255,255,0.06)] text-[#9a9590]"}`}>
                      <span>🔵</span> 支付宝
                    </button>
                  </div>
                  <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="给作者留句话（可选）" maxLength={100}
                    className="w-full px-4 py-2 mb-4 rounded-lg bg-[#1a1a2e] border border-[rgba(212,168,83,0.08)] text-[#e8e6e3] placeholder-[#555] text-sm focus:outline-none focus:border-[#d4a853]" />
                  <button onClick={handleSubmit} disabled={loading || amount < 1}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-40">
                    {loading ? "提交中..." : `确认打赏 ¥${amount}`}
                  </button>
                </>
              )}

              {step === "qrcode" && (
                <div className="text-center">
                  <p className="text-sm text-[#9a9590] mb-4">请使用<span style={{ color: qrColor }}>{qrLabel}</span>扫码支付</p>
                  <div className="relative w-56 h-56 mx-auto mb-4 rounded-xl overflow-hidden border-2" style={{ borderColor: qrColor }}>
                    <Image src={qrImage} alt={`${qrLabel}支付二维码`} fill className="object-contain" unoptimized />
                  </div>
                  <p className="text-2xl font-bold text-[#d4a853] mb-1">¥{amount}</p>
                  {message && <p className="text-xs text-[#555] italic mb-3">「{message}」</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setStep("done")} className="flex-1 py-2 rounded-lg bg-[rgba(212,168,83,0.12)] text-[#d4a853] text-sm hover:bg-[rgba(212,168,83,0.18)] transition-colors">已完成支付</button>
                    <button onClick={() => setStep("select")} className="flex-1 py-2 rounded-lg bg-[#1a1a2e] text-[#555] text-sm hover:text-[#e8e6e3] transition-colors">返回修改</button>
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-[family-name:var(--font-ma-shan)] text-xl text-[#d4a853] mb-1">感谢支持</p>
                  <p className="text-sm text-[#9a9590]">您已打赏 ¥{amount}，心意已收到</p>
                  {message && <p className="text-xs text-[#555] mt-2 italic">「{message}」</p>}
                  <button onClick={() => setOpen(false)} className="mt-6 px-6 py-2 rounded-full bg-[rgba(212,168,83,0.12)] text-[#d4a853] text-sm hover:bg-[rgba(212,168,83,0.18)] transition-colors">关闭</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

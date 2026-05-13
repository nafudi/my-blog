"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface DonationModalProps {
  postSlug: string;
  postTitle: string;
}

export default function DonationModal({ postSlug, postTitle }: DonationModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"alipay" | "wechat">("wechat");
  const [step, setStep] = useState<"select" | "qrcode" | "done">("select");

  const handleOpen = () => {
    setOpen(true);
    setStep("select");
  };

  const qrImage = payMethod === "wechat" ? "/donations/wechat.jpg" : "/donations/alipay.jpg";
  const qrLabel = payMethod === "wechat" ? "微信" : "支付宝";
  const qrColor = payMethod === "wechat" ? "#07C160" : "#1677FF";

  return (
    <>
      <button onClick={handleOpen}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] hover:shadow-lg hover:shadow-[rgba(212,168,83,0.3)]"
        title="赞赏作者">
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
              <p className="text-xs text-[#555] mb-5">为「{postTitle}」打赏</p>

              {step === "select" && (
                <>
                  <p className="text-sm text-[#9a9590] mb-4">请选择支付方式</p>
                  <div className="flex gap-3 mb-6">
                    <button onClick={() => { setPayMethod("wechat"); setStep("qrcode"); }}
                      className="flex-1 py-4 rounded-xl flex flex-col items-center gap-2 text-sm font-medium transition-all bg-[#07C160]/10 border border-[#07C160] text-[#07C160]">
                      <span className="text-3xl">💚</span>
                      <span>微信支付</span>
                    </button>
                    <button onClick={() => { setPayMethod("alipay"); setStep("qrcode"); }}
                      className="flex-1 py-4 rounded-xl flex flex-col items-center gap-2 text-sm font-medium transition-all bg-[#1677FF]/10 border border-[#1677FF] text-[#1677FF]">
                      <span className="text-3xl">🔵</span>
                      <span>支付宝</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#555] text-center">扫码支付，金额随意 ❤️</p>
                </>
              )}

              {step === "qrcode" && (
                <div className="text-center">
                  <p className="text-sm text-[#9a9590] mb-4">请使用<span style={{ color: qrColor }}>{qrLabel}</span>扫码支付</p>
                  <div className="relative w-64 h-64 mx-auto mb-4 rounded-xl overflow-hidden border-2" style={{ borderColor: qrColor }}>
                    <Image src={qrImage} alt={`${qrLabel}支付二维码`} fill className="object-contain" unoptimized />
                  </div>
                  <p className="text-sm text-[#9a9590] mb-1">金额随意，扫码即付</p>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep("done")} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#d4a853] to-[#a67c3d] text-[#0a0a0f] font-semibold hover:opacity-90 transition-opacity">✅ 已完成支付</button>
                    <button onClick={() => setStep("select")} className="flex-1 py-3 rounded-lg bg-[#1a1a2e] text-[#9a9590] text-sm hover:text-[#e8e6e3] transition-colors">返回</button>
                  </div>
                </div>
              )}

              {step === "done" && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">🎉</div>
                  <p className="font-[family-name:var(--font-ma-shan)] text-xl text-[#d4a853] mb-2">感谢支持</p>
                  <p className="text-sm text-[#9a9590]">心意已收到，感谢您的慷慨</p>
                  <button onClick={() => setOpen(false)} className="mt-6 px-8 py-2 rounded-full bg-[rgba(212,168,83,0.12)] text-[#d4a853] text-sm hover:bg-[rgba(212,168,83,0.18)] transition-colors">关闭</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

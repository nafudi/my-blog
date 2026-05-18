"use client";

import { useEffect, useRef } from "react";

export default function Heartbeat() {
  const sidRef = useRef("");

  useEffect(() => {
    // 生成持久化的 sessionId（localStorage 跨标签页共享）
    if (!sidRef.current) {
      let sid = localStorage.getItem("_hb_sid");
      if (!sid) {
        sid = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("_hb_sid", sid);
      }
      sidRef.current = sid;
    }

    // 立即发一次
    beat();

    // 每 30 秒心跳
    const timer = setInterval(beat, 30000);

    // 页面可见性变化时也心跳
    const handleVisible = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  async function beat() {
    try {
      await fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: sidRef.current }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  return null; // 无 UI，纯功能组件
}

"use client";

import { useEffect, useRef, useCallback } from "react";

interface StarBgProps {
  className?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export default function StarBg({ className = "" }: StarBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 6000);
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      starsRef.current = initStars(rect.width, rect.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let width = canvas.getBoundingClientRect().width;
    let height = canvas.getBoundingClientRect().height;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 深色渐变背景
      const gradient = ctx.createRadialGradient(
        width * 0.3, height * 0.2, 0,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.9
      );
      gradient.addColorStop(0, "#0a0a14");
      gradient.addColorStop(0.3, "#060610");
      gradient.addColorStop(1, "#020205");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星星
      const time = Date.now() * 0.001;
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset);
        const currentOpacity = star.opacity + twinkle * 0.2;

        // 大星星带光晕
        if (star.size > 1.5) {
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 4
          );
          glow.addColorStop(0, `rgba(180, 200, 255, ${currentOpacity * 0.3})`);
          glow.addColorStop(1, "rgba(180, 200, 255, 0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // 星星本体
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 255, ${currentOpacity})`;
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [initStars]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}

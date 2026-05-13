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
  const imageRef = useRef<HTMLImageElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);

  const initStars = useCallback((width: number, height: number) => {
    // 减少星星数量，约每3000像素一个星星
    const count = Math.floor((width * height) / 8000);
    const arr: Star[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
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

    // 加载背景图片
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
    };
    // 使用深色宇宙背景图
    img.src = "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80";

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

      // 绘制背景图片
      if (imageRef.current) {
        // 计算缩放以覆盖整个画布
        const imgRatio = imageRef.current.width / imageRef.current.height;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawHeight = height;
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        }

        // 添加暗色叠加层
        ctx.fillStyle = "rgba(5, 5, 10, 0.3)";
        ctx.fillRect(0, 0, width, height);

        // 绘制图片
        ctx.globalAlpha = 0.7;
        ctx.drawImage(imageRef.current, offsetX, offsetY, drawWidth, drawHeight);
        ctx.globalAlpha = 1;
      } else {
        // 如果图片未加载，使用深色渐变
        const gradient = ctx.createRadialGradient(
          width * 0.4, height * 0.3, 0,
          width * 0.5, height * 0.5, Math.max(width, height) * 0.8
        );
        gradient.addColorStop(0, "#0d1b2a");
        gradient.addColorStop(0.4, "#0a0a15");
        gradient.addColorStop(1, "#050508");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 绘制稀疏的星星
      const time = Date.now() * 0.001;
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset);
        const currentOpacity = star.opacity + twinkle * 0.15;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        if (star.size > 1.2) {
          // 稍大的星星带淡淡光芒
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 3
          );
          glow.addColorStop(0, `rgba(200, 220, 255, ${currentOpacity * 0.2})`);
          glow.addColorStop(1, "rgba(200, 220, 255, 0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
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

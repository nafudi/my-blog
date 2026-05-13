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

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

export default function StarBg({ className = "" }: StarBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastShootingStarRef = useRef<number>(0);

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 3000); // 根据屏幕大小调整星星数量
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

    const createShootingStar = () => {
      if (Math.random() > 0.98) { // 约2%的概率生成流星
        shootingStarsRef.current.push({
          x: Math.random() * width * 1.5,
          y: Math.random() * height * 0.3,
          length: Math.random() * 80 + 40,
          speed: Math.random() * 8 + 6,
          opacity: Math.random() * 0.6 + 0.4,
          angle: Math.PI / 4 + Math.random() * 0.3,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 深空渐变背景
      const gradient = ctx.createRadialGradient(
        width * 0.3, height * 0.2, 0,
        width * 0.5, height * 0.5, width * 0.8
      );
      gradient.addColorStop(0, "#0d1b2a");
      gradient.addColorStop(0.5, "#0a0a12");
      gradient.addColorStop(1, "#050508");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 绘制星星
      const time = Date.now() * 0.001;
      for (const star of starsRef.current) {
        // 闪烁效果
        const twinkle = Math.sin(time * star.twinkleSpeed * 100 + star.twinkleOffset);
        const currentOpacity = star.opacity + twinkle * 0.2;

        // 星星本体
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);

        // 根据大小选择不同颜色
        if (star.size > 2) {
          // 大星星带光芒
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.fill();

          // 光芒效果
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 4
          );
          glow.addColorStop(0, `rgba(200, 220, 255, ${currentOpacity * 0.3})`);
          glow.addColorStop(1, "rgba(200, 220, 255, 0)");
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        } else if (star.size > 1.5) {
          // 中等星星 - 淡蓝色
          ctx.fillStyle = `rgba(200, 210, 255, ${currentOpacity})`;
          ctx.fill();
        } else {
          // 小星星 - 白色
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.fill();
        }
      }

      // 绘制流星
      const now = Date.now();
      if (now - lastShootingStarRef.current > 500) {
        createShootingStar();
        lastShootingStarRef.current = now;
      }

      // 更新和绘制流星
      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        star.x -= star.speed * Math.cos(star.angle);
        star.y += star.speed * Math.sin(star.angle);
        star.opacity -= 0.01;

        if (star.opacity <= 0 || star.x < -100 || star.y > height + 100) {
          return false;
        }

        // 绘制流星
        const gradient = ctx.createLinearGradient(
          star.x, star.y,
          star.x + star.length * Math.cos(star.angle),
          star.y - star.length * Math.sin(star.angle)
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x + star.length * Math.cos(star.angle),
          star.y - star.length * Math.sin(star.angle)
        );
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        return true;
      });

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

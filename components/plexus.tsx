"use client";

import { useEffect, useRef } from "react";

type Dot = { x: number; y: number; vx: number; vy: number };

const LINK = 130;
const REACH = 180;

export function Plexus() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999 };
    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;

    function resize() {
      if (!el || !ctx) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = width * ratio;
      el.height = height * ratio;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(120, Math.round((width * height) / 13000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const dot of dots) {
        if (!still) {
          const dx = mouse.x - dot.x;
          const dy = mouse.y - dot.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 1) {
            dot.vx += (dx / dist) * 0.012;
            dot.vy += (dy / dist) * 0.012;
          }
          dot.vx *= 0.99;
          dot.vy *= 0.99;
          const speed = Math.hypot(dot.vx, dot.vy);
          if (speed < 0.12) {
            dot.vx += (Math.random() - 0.5) * 0.05;
            dot.vy += (Math.random() - 0.5) * 0.05;
          }
          dot.x += dot.vx;
          dot.y += dot.vy;
          if (dot.x < 0 || dot.x > width) dot.vx *= -1;
          if (dot.y < 0 || dot.y > height) dot.vy *= -1;
          dot.x = Math.max(0, Math.min(width, dot.x));
          dot.y = Math.max(0, Math.min(height, dot.y));
        }
      }

      for (let i = 0; i < dots.length; i++) {
        const a = dots[i];
        for (let j = i + 1; j < dots.length; j++) {
          const b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > LINK) continue;
          ctx.strokeStyle = `rgba(92, 176, 120, ${(1 - dist / LINK) * 0.42})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        const toMouse = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (toMouse < REACH) {
          ctx.strokeStyle = `rgba(80, 170, 110, ${(1 - toMouse / REACH) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(96, 184, 126, 0.7)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!still) frame = requestAnimationFrame(draw);
    }

    function move(event: PointerEvent) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (still) draw();
    }

    function leave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function visibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden && !still) frame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}

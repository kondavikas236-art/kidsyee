"use client";

import { useEffect, useRef, useState } from "react";

/**
 * RealisticSnake - a top-down python drawn in SVG that truly slithers:
 * its spine follows a travelling sine wave every frame, the body tapers to
 * a thin tail, has a rounded "3D" gradient with a glossy highlight, dark
 * blotch pattern, a head with eyes and a flicking forked tongue, and a soft
 * shadow under it. The snake faces right (head at the right end).
 */
const N = 48; // spine points
const BODY = 290; // body length in SVG units
const CY = 45; // centre line
const WAVELENGTH = 150;
const SPOTS = 11;

function width(s: number) {
  // s: 0 = tail tip, 1 = neck
  const tail = Math.min(1, s / 0.45);
  const taper = tail * tail * (3 - 2 * tail); // smoothstep
  const neck = s > 0.93 ? 1 - (s - 0.93) * 2.5 : 1;
  return 0.6 + 14 * taper * neck; // pointed tail tip
}

function RealisticSnake({ phase }: { phase: number }) {
  const bodyRef = useRef<SVGPathElement>(null);
  const shadowRef = useRef<SVGPathElement>(null);
  const shineRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const spotRefs = useRef<(SVGEllipseElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000 + phase;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const x = 8 + s * BODY;
        const amp = 17 * (1 - 0.65 * Math.pow(s, 3)); // head stays steadier
        const y = CY + amp * Math.sin((2 * Math.PI * x) / WAVELENGTH - t * 5.5);
        pts.push({ x, y });
      }
      const left: string[] = [];
      const right: string[] = [];
      const shine: string[] = [];
      const normals = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(N, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        return { nx: -dy / len, ny: dx / len, ang: Math.atan2(dy, dx) };
      });
      pts.forEach((p, i) => {
        const w = width(i / N);
        const { nx, ny } = normals[i];
        left.push(`${(p.x + nx * w).toFixed(1)},${(p.y + ny * w).toFixed(1)}`);
        right.push(`${(p.x - nx * w).toFixed(1)},${(p.y - ny * w).toFixed(1)}`);
        if (i > 4 && i < N - 1) shine.push(`${(p.x + nx * w * 0.45).toFixed(1)},${(p.y + ny * w * 0.45).toFixed(1)}`);
      });
      const d = `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
      bodyRef.current?.setAttribute("d", d);
      shadowRef.current?.setAttribute("d", d);
      shineRef.current?.setAttribute("d", `M${shine.join(" L")}`);

      const head = pts[N];
      const deg = (normals[N].ang * 180) / Math.PI;
      headRef.current?.setAttribute("transform", `translate(${head.x.toFixed(1)} ${head.y.toFixed(1)}) rotate(${deg.toFixed(1)})`);

      spotRefs.current.forEach((el, k) => {
        if (!el) return;
        const i = Math.round(6 + (k * (N - 9)) / SPOTS);
        const p = pts[i];
        const w = width(i / N);
        el.setAttribute("cx", p.x.toFixed(1));
        el.setAttribute("cy", p.y.toFixed(1));
        el.setAttribute("rx", (w * 0.75).toFixed(1));
        el.setAttribute("ry", (w * 0.55).toFixed(1));
        el.setAttribute("transform", `rotate(${((normals[i].ang * 180) / Math.PI).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <svg viewBox="0 0 340 90" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="snBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24410F" />
          <stop offset="35%" stopColor="#6E9A2C" />
          <stop offset="50%" stopColor="#A9C94E" />
          <stop offset="65%" stopColor="#6E9A2C" />
          <stop offset="100%" stopColor="#1E360C" />
        </linearGradient>
        <radialGradient id="snHead" cx="40%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#9DBF45" />
          <stop offset="60%" stopColor="#557A22" />
          <stop offset="100%" stopColor="#1E360C" />
        </radialGradient>
        <filter id="snShadow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <path ref={shadowRef} fill="#000" opacity="0.32" filter="url(#snShadow)" transform="translate(6 9)" />
      <path ref={bodyRef} fill="url(#snBody)" stroke="#16280A" strokeWidth="0.8" />
      {Array.from({ length: SPOTS }).map((_, k) => (
        <ellipse key={k} ref={(el) => { spotRefs.current[k] = el; }} fill="#2A1A08" opacity="0.55" />
      ))}
      <path ref={shineRef} fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Head (local coords: x forward) */}
      <g ref={headRef}>
        <g className="sn-tongue">
          <path d="M22 0 L34 0 L39 -3 M34 0 L39 3" stroke="#C0182B" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
        <path d="M-12 -11.5 C -2 -15, 12 -15, 21 -8 C 27 -3, 28 3, 21 8 C 12 15, -2 15, -12 11.5 C -9 4, -9 -4, -12 -11.5 Z" fill="url(#snHead)" />
        <path d="M-6 -13.5 C 6 -15, 16 -12, 21 -8 C 27 -3, 28 3, 21 8 C 16 12, 6 15, -6 13.5" fill="none" stroke="#16280A" strokeWidth="0.8" />
        <ellipse cx="4" cy="-3" rx="7" ry="3" fill="#FFFFFF" opacity="0.25" />
        <ellipse cx="12" cy="-8.5" rx="3.2" ry="2.6" fill="#E8C200" />
        <ellipse cx="12" cy="8.5" rx="3.2" ry="2.6" fill="#E8C200" />
        <ellipse cx="12.4" cy="-8.5" rx="0.8" ry="2.2" fill="#000" />
        <ellipse cx="12.4" cy="8.5" rx="0.8" ry="2.2" fill="#000" />
        <circle cx="22" cy="-2.5" r="0.7" fill="#0B1404" />
        <circle cx="22" cy="2.5" r="0.7" fill="#0B1404" />
      </g>
    </svg>
  );
}

interface SnakeInstance {
  id: number;
  top: string;
  duration: string;
  delay: string;
  scale: number;
  reverse: boolean;
  phase: number;
}

export function SnakeOverlay({ active }: { active: boolean }) {
  const [snakes, setSnakes] = useState<SnakeInstance[]>([]);

  useEffect(() => {
    if (active) {
      setSnakes(
        Array.from({ length: 5 }).map((_, i) => ({
          id: i,
          top: `${5 + Math.random() * 80}%`,
          duration: `${9 + Math.random() * 6}s`,
          delay: `${Math.random() * 6}s`,
          scale: 0.7 + Math.random() * 0.4,
          reverse: i % 2 === 1,
          phase: Math.random() * 10,
        }))
      );
    } else {
      setSnakes([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {snakes.map((snake) => (
        <div
          key={snake.id}
          className={snake.reverse ? "absolute animate-snake-rtl" : "absolute animate-snake-ltr"}
          style={{
            top: snake.top,
            left: 0,
            width: "340px",
            height: "90px",
            animationDuration: snake.duration,
            animationDelay: snake.delay,
            animationFillMode: "backwards",
          }}
        >
          <div
            className="w-full h-full"
            style={{ transform: `scale(${snake.reverse ? -snake.scale : snake.scale}, ${snake.scale})` }}
          >
            <RealisticSnake phase={snake.phase} />
          </div>
        </div>
      ))}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
    </div>
  );
}

/** A single snake slithering in place, for previews. */
export function SnakePreview() {
  return <RealisticSnake phase={0} />;
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Realistic wandering snakes.
 *
 * Each snake steers on its own in random directions: its turning changes
 * smoothly at random, it turns back when it nears a screen edge, and its
 * body follows the exact trail its head travelled (plus a small slither
 * wave), so curves look natural. Drawn in SVG with a rounded "3D" body
 * (dark edge, lighter core and glossy highlight), a blotch pattern, a head
 * with eyes and a flicking forked tongue, and a soft shadow.
 */

const N = 44; // spine points
const SPOTS = 10;
const EDGE = 70; // px: start steering back inside before this distance from an edge

function width(s: number) {
  // s: 0 = tail tip, 1 = neck
  const t = Math.min(1, s / 0.45);
  const taper = t * t * (3 - 2 * t);
  const neck = s > 0.93 ? 1 - (s - 0.93) * 2.5 : 1;
  return 0.6 + 14 * taper * neck;
}

type Pt = { x: number; y: number };

function outline(pts: Pt[], normals: { nx: number; ny: number }[], k: number, scale: number) {
  const left: string[] = [];
  const right: string[] = [];
  pts.forEach((p, i) => {
    const w = width(i / N) * k * scale;
    left.push(`${(p.x + normals[i].nx * w).toFixed(1)},${(p.y + normals[i].ny * w).toFixed(1)}`);
    right.push(`${(p.x - normals[i].nx * w).toFixed(1)},${(p.y - normals[i].ny * w).toFixed(1)}`);
  });
  return `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
}

function WanderingSnake({ scale, delayMs }: { scale: number; delayMs: number }) {
  const g = useRef<SVGGElement>(null);
  const shadow = useRef<SVGPathElement>(null);
  const edge = useRef<SVGPathElement>(null);
  const core = useRef<SVGPathElement>(null);
  const centre = useRef<SVGPathElement>(null);
  const shine = useRef<SVGPathElement>(null);
  const head = useRef<SVGGElement>(null);
  const spots = useRef<(SVGEllipseElement | null)[]>([]);

  useEffect(() => {
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const bodyLen = 290 * scale;
    const spacing = bodyLen / N;

    // Enter from a random edge, heading roughly inward.
    const side = Math.floor(Math.random() * 4);
    let x = side === 0 ? -40 : side === 1 ? W() + 40 : Math.random() * W();
    let y = side === 2 ? -40 : side === 3 ? H() + 40 : Math.random() * H();
    const toCentre = Math.atan2(H() / 2 - y, W() / 2 - x);
    let heading = toCentre + (Math.random() - 0.5) * 1.2;
    let turn = 0;
    const speed = (75 + Math.random() * 45) * Math.max(0.8, scale);

    // Trail of past head positions, pre-filled as a straight line behind the head.
    const trail: Pt[] = [];
    for (let d = bodyLen + 40; d >= 0; d -= 3) {
      trail.push({ x: x - Math.cos(heading) * d, y: y - Math.sin(heading) * d });
    }

    let raf = 0;
    let last = performance.now();
    const t0 = last + delayMs;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now < t0) { last = now; return; }
      if (g.current) g.current.style.opacity = "1";
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      // --- steering: random wander + edge avoidance ---
      turn += (Math.random() - 0.5) * 6 * dt;
      turn = Math.max(-1.6, Math.min(1.6, turn * 0.985));
      const inside = x > EDGE && x < W() - EDGE && y > EDGE && y < H() - EDGE;
      if (!inside) {
        const want = Math.atan2(H() / 2 - y, W() / 2 - x);
        let diff = want - heading;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        turn += Math.sign(diff) * 3.5 * dt;
      }
      heading += turn * dt;
      x += Math.cos(heading) * speed * dt;
      y += Math.sin(heading) * speed * dt;

      const lastPt = trail[trail.length - 1];
      if (Math.hypot(x - lastPt.x, y - lastPt.y) >= 2) trail.push({ x, y });
      if (trail.length > 600) trail.splice(0, trail.length - 600);

      // --- sample the spine backwards along the trail (head -> tail) ---
      const raw: Pt[] = [{ x, y }];
      let need = spacing;
      let j = trail.length - 1;
      let cur: Pt = { x, y };
      while (raw.length <= N && j > 0) {
        const prev = trail[j - 1];
        const seg = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        if (seg >= need) {
          const f = need / seg;
          cur = { x: cur.x + (prev.x - cur.x) * f, y: cur.y + (prev.y - cur.y) * f };
          raw.push(cur);
          need = spacing;
        } else {
          need -= seg;
          cur = prev;
          j--;
        }
      }
      while (raw.length <= N) raw.push(raw[raw.length - 1]);
      raw.reverse(); // now tail -> head

      // tangents/normals, then a small slither wave (calmer near the head)
      const norm = (pts: Pt[]) => pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        return { nx: -dy / len, ny: dx / len, ang: Math.atan2(dy, dx) };
      });
      const n0 = norm(raw);
      const pts = raw.map((p, i) => {
        const s = i / N;
        const amp = 7 * scale * (1 - 0.8 * Math.pow(s, 2));
        const off = amp * Math.sin(s * 2.2 * Math.PI * 2 - t * 7);
        return { x: p.x + n0[i].nx * off, y: p.y + n0[i].ny * off };
      });
      const nm = norm(pts);

      const body = outline(pts, nm, 1, scale);
      edge.current?.setAttribute("d", body);
      shadow.current?.setAttribute("d", body);
      core.current?.setAttribute("d", outline(pts, nm, 0.68, scale));
      centre.current?.setAttribute("d", outline(pts, nm, 0.28, scale));
      const sh: string[] = [];
      pts.forEach((p, i) => {
        if (i < 5 || i > N - 2) return;
        const w = width(i / N) * scale * 0.42;
        sh.push(`${(p.x + nm[i].nx * w).toFixed(1)},${(p.y + nm[i].ny * w).toFixed(1)}`);
      });
      shine.current?.setAttribute("d", `M${sh.join(" L")}`);

      spots.current.forEach((el, k) => {
        if (!el) return;
        const i = Math.round(6 + (k * (N - 9)) / SPOTS);
        const p = pts[i];
        const w = width(i / N) * scale;
        el.setAttribute("cx", p.x.toFixed(1));
        el.setAttribute("cy", p.y.toFixed(1));
        el.setAttribute("rx", (w * 0.75).toFixed(1));
        el.setAttribute("ry", (w * 0.55).toFixed(1));
        el.setAttribute("transform", `rotate(${((nm[i].ang * 180) / Math.PI).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });

      const hp = pts[N];
      const deg = (nm[N].ang * 180) / Math.PI;
      head.current?.setAttribute("transform", `translate(${hp.x.toFixed(1)} ${hp.y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${scale})`);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [scale, delayMs]);

  return (
    <g ref={g} style={{ opacity: 0 }}>
      <path ref={shadow} fill="#000" opacity="0.3" filter="url(#snShadow)" transform="translate(6 9)" />
      <path ref={edge} fill="#1F3A0C" />
      <path ref={core} fill="#6F9B2B" filter="url(#snSoft)" />
      <path ref={centre} fill="#B3D35A" opacity="0.75" filter="url(#snSoft)" />
      {Array.from({ length: SPOTS }).map((_, k) => (
        <ellipse key={k} ref={(el) => { spots.current[k] = el; }} fill="#2A1A08" opacity="0.5" />
      ))}
      <path ref={shine} fill="none" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth={2 * scale} strokeLinecap="round" strokeLinejoin="round" />
      <g ref={head}>
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
    </g>
  );
}

interface SnakeInstance {
  id: number;
  scale: number;
  delayMs: number;
}

export function SnakeOverlay({ active }: { active: boolean }) {
  const [snakes, setSnakes] = useState<SnakeInstance[]>([]);

  useEffect(() => {
    if (active) {
      setSnakes(
        Array.from({ length: 5 }).map((_, i) => ({
          id: i,
          scale: 0.75 + Math.random() * 0.4,
          delayMs: i === 0 ? 0 : Math.random() * 4000,
        }))
      );
    } else {
      setSnakes([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      <div className="absolute inset-0 bg-black/5" />
      <svg className="absolute inset-0 w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="snHead" cx="40%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#9DBF45" />
            <stop offset="60%" stopColor="#557A22" />
            <stop offset="100%" stopColor="#1E360C" />
          </radialGradient>
          <filter id="snShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="snSoft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {snakes.map((s) => (
          <WanderingSnake key={s.id} scale={s.scale} delayMs={s.delayMs} />
        ))}
      </svg>
    </div>
  );
}

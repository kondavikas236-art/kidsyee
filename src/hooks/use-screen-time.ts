"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tracks real screen time spent inside Kidsyee on this device.
 *
 * - Counts only while the tab/app is visible.
 * - Stored per calendar day in localStorage, so it resets every morning.
 * - A completed eye break gives a short "grace period" during which the
 *   cockroach deterrent stays away, instead of wiping the whole day's usage.
 */

const STORAGE_KEY = "kidsyee-screen-time";
const BREAK_KEY = "kidsyee-break-until";
export const BREAK_GRACE_MINUTES = 10;
const TICK_MS = 15_000;

type Stored = { date: string; seconds: number };

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function readSeconds(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Stored;
    return parsed.date === today() ? parsed.seconds : 0;
  } catch {
    return 0;
  }
}

function writeSeconds(seconds: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), seconds }));
  } catch {}
}

function readBreakUntil(): number {
  try {
    return Number(localStorage.getItem(BREAK_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function useScreenTime() {
  const [seconds, setSeconds] = useState(0);
  const [breakUntil, setBreakUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setSeconds(readSeconds());
    setBreakUntil(readBreakUntil());

    let last = Date.now();
    const tick = () => {
      const t = Date.now();
      if (document.visibilityState === "visible") {
        // Cap each step so a sleeping device doesn't add hours at once.
        const delta = Math.min((t - last) / 1000, TICK_MS / 1000 * 2);
        const next = readSeconds() + delta;
        writeSeconds(next);
        setSeconds(next);
      }
      last = t;
      setNow(t);
    };
    const id = setInterval(tick, TICK_MS);
    const onVisibility = () => { last = Date.now(); };
    const onStorage = () => { setSeconds(readSeconds()); setBreakUntil(readBreakUntil()); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("kidsyee:screen-time-updated", onStorage);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("kidsyee:screen-time-updated", onStorage);
    };
  }, []);

  const startBreakGrace = useCallback(() => {
    const until = Date.now() + BREAK_GRACE_MINUTES * 60_000;
    try { localStorage.setItem(BREAK_KEY, String(until)); } catch {}
    setBreakUntil(until);
    window.dispatchEvent(new Event("kidsyee:screen-time-updated"));
  }, []);

  return {
    minutes: Math.floor(seconds / 60),
    isOnBreakGrace: now < breakUntil,
    startBreakGrace,
  };
}

export function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

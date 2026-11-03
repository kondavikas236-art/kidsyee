"use client";

import { useEffect, useState } from "react";

interface BugInstance {
  id: number;
  animationClass: string;
  duration: string;
  delay: string;
  scale: number;
}

/**
 * RealisticCockroach - A custom SVG cockroach designed with amber gradients,
 * long antennae, and spiky legs to mimic a real insect infestation.
 */
function RealisticCockroach() {
  return (
    <svg 
      viewBox="0 0 100 150" 
      className="w-full h-full drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="bugGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="60%" stopColor="#5D2E0A" />
          <stop offset="100%" stopColor="#1A0F03" />
        </radialGradient>
      </defs>
      
      {/* Long Antennae */}
      <path d="M48 22 Q 40 -10 15 5" stroke="#1A0F03" strokeWidth="1.2" fill="none" opacity="0.9" />
      <path d="M52 22 Q 60 -10 85 5" stroke="#1A0F03" strokeWidth="1.2" fill="none" opacity="0.9" />

      {/* Spiky Legs - 3 pairs */}
      <g stroke="#1A0F03" strokeWidth="3" fill="none" strokeLinecap="round">
        {/* Front Legs */}
        <path d="M35 50 L12 30" />
        <path d="M65 50 L88 30" />
        {/* Middle Legs */}
        <path d="M30 75 L8 75" />
        <path d="M70 75 L92 75" />
        {/* Back Legs */}
        <path d="M35 105 L18 140" />
        <path d="M65 105 L82 140" />
      </g>

      {/* Main Body (Abdomen and Thorax) */}
      <ellipse cx="50" cy="85" rx="24" ry="52" fill="url(#bugGradient)" />
      
      {/* Wing Texture Detail */}
      <path d="M50 35 L50 135" stroke="#000" strokeWidth="1" opacity="0.5" />
      <path d="M30 60 Q 50 55 70 60" stroke="#000" strokeWidth="0.5" fill="none" opacity="0.3" />
      
      {/* Head */}
      <circle cx="50" cy="32" r="11" fill="#1A0F03" />
      
      {/* Beady Eyes */}
      <circle cx="44" cy="29" r="2" fill="#333" />
      <circle cx="56" cy="29" r="2" fill="#333" />
    </svg>
  );
}

export function CockroachOverlay({ active }: { active: boolean }) {
  const [bugs, setBugs] = useState<BugInstance[]>([]);

  useEffect(() => {
    if (active) {
      // Create a swarm of lifelike insects with different paths
      const animationClasses = [
        'animate-scurry-1',
        'animate-scurry-2',
        'animate-scurry-3',
        'animate-scurry-4'
      ];

      const newBugs = Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        // Randomly pick one of the corner-to-corner paths
        animationClass: animationClasses[Math.floor(Math.random() * animationClasses.length)],
        duration: `${Math.random() * 3 + 6}s`, 
        delay: `${Math.random() * 8}s`,
        scale: 0.5 + Math.random() * 0.4,
      }));
      setBugs(newBugs);
    } else {
      setBugs([]);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {bugs.map((bug) => (
        <div
          key={bug.id}
          className={`absolute ${bug.animationClass}`}
          style={{
            animationDuration: bug.duration,
            animationDelay: bug.delay,
            // Stay at the off-screen start point while waiting, instead of piling up top-left.
            animationFillMode: "backwards",
            top: 0,
            left: 0,
            width: "80px",
            height: "120px",
          }}
        >
          {/* Size lives on its own wrapper: the scurry animation's transform would overwrite it. */}
          <div className="w-full h-full origin-center" style={{ transform: `scale(${bug.scale})` }}>
            {/* Leg vibration animation nested inside the scurry */}
            <div className="animate-bug-vibrate origin-center w-full h-full">
              <RealisticCockroach />
            </div>
          </div>
        </div>
      ))}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px] pointer-events-none" />
    </div>
  );
}
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
 * RealisticCockroach - a detailed, glossy, "3D" cockroach drawn in SVG:
 * jointed spiny legs with a tripod walking gait, swaying antennae,
 * shiny amber wings with highlights, the pale-rimmed pronotum (head shield),
 * tail cerci, and a soft contact shadow so it looks like it is on the screen.
 */
function RealisticCockroach() {
  return (
    <svg viewBox="0 0 100 160" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crWing" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B1A06" />
          <stop offset="30%" stopColor="#7A3A10" />
          <stop offset="55%" stopColor="#A85A1F" />
          <stop offset="80%" stopColor="#6B300C" />
          <stop offset="100%" stopColor="#2A1204" />
        </linearGradient>
        <radialGradient id="crPronotum" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#3A1B08" />
          <stop offset="55%" stopColor="#5E2C0D" />
          <stop offset="78%" stopColor="#C9944F" />
          <stop offset="100%" stopColor="#8A5626" />
        </radialGradient>
        <linearGradient id="crShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="crLeg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5A2A0C" />
          <stop offset="100%" stopColor="#241005" />
        </linearGradient>
        <filter id="crShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Contact shadow on the "screen" */}
      <ellipse cx="54" cy="96" rx="26" ry="56" fill="#000" opacity="0.35" filter="url(#crShadow)" />

      {/* Antennae */}
      <g className="cr-antenna-l" style={{ transformOrigin: "46px 24px" }}>
        <path d="M46 24 C 38 8, 26 -6, 6 -18" stroke="#2A1204" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>
      <g className="cr-antenna-r" style={{ transformOrigin: "54px 24px" }}>
        <path d="M54 24 C 62 8, 74 -6, 94 -18" stroke="#2A1204" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      </g>

      {/* Legs (tripod gait: A and B groups alternate) */}
        <g className="cr-leg-a" style={{ transformOrigin: "43px 52px" }}>
          <path d="M43 52 L30 46 L18 30 L12 18 M24 38 l-3 -1 M16 26 l-3 0" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="cr-leg-b" style={{ transformOrigin: "57px 52px" }}>
          <path d="M57 52 L70 46 L82 30 L88 18 M76 38 l3 -1 M84 26 l3 0" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="cr-leg-b" style={{ transformOrigin: "42px 62px" }}>
          <path d="M42 62 L26 64 L10 72 L2 80 M18 68 l-1 3 M7 75 l-1 3" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="cr-leg-a" style={{ transformOrigin: "58px 62px" }}>
          <path d="M58 62 L74 64 L90 72 L98 80 M82 68 l1 3 M93 75 l1 3" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="cr-leg-a" style={{ transformOrigin: "43px 72px" }}>
          <path d="M43 72 L30 88 L20 112 L14 134 M25 100 l-3 0 M17 122 l-3 0" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g className="cr-leg-b" style={{ transformOrigin: "57px 72px" }}>
          <path d="M57 72 L70 88 L80 112 L86 134 M75 100 l3 0 M83 122 l3 0" stroke="url(#crLeg)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

      {/* Tail cerci */}
      <path d="M46 146 L40 158" stroke="#3B1A06" strokeWidth="2" strokeLinecap="round" />
      <path d="M54 146 L60 158" stroke="#3B1A06" strokeWidth="2" strokeLinecap="round" />

      {/* Abdomen peeking out under the wings */}
      <ellipse cx="50" cy="104" rx="20" ry="44" fill="#4A2208" />
      <g stroke="#2A1204" strokeWidth="0.8" opacity="0.7" fill="none">
        <path d="M33 120 Q50 125 67 120" /><path d="M35 130 Q50 135 65 130" /><path d="M39 139 Q50 143 61 139" />
      </g>

      {/* Wings (tegmina), left over right */}
      <path d="M50 46 C 70 50, 74 90, 70 120 C 67 138, 58 148, 50 148 Z" fill="url(#crWing)" />
      <path d="M50 46 C 30 50, 26 90, 30 120 C 33 138, 42 148, 52 146 C 48 120, 47 80, 50 46 Z" fill="url(#crWing)" stroke="#2A1204" strokeWidth="0.6" />
      {/* Wing veins */}
      <g stroke="#2A1204" strokeWidth="0.5" opacity="0.45" fill="none">
        <path d="M44 56 C 38 80, 38 110, 42 138" /><path d="M38 64 C 33 90, 34 112, 37 128" /><path d="M58 58 C 63 85, 63 112, 59 136" />
      </g>
      {/* Glossy highlights = the 3D shine */}
      <path d="M41 56 C 35 76, 35 100, 38 118 C 40 104, 41 80, 45 58 Z" fill="url(#crShine)" opacity="0.8" />
      <path d="M60 60 C 64 76, 65 92, 64 104 C 62 92, 60 78, 57 62 Z" fill="url(#crShine)" opacity="0.4" />

      {/* Pronotum (shield) with pale rim and dark centre */}
      <path d="M50 30 C 66 30, 72 40, 70 48 C 68 54, 60 56, 50 56 C 40 56, 32 54, 30 48 C 28 40, 34 30, 50 30 Z" fill="url(#crPronotum)" />
      <ellipse cx="44" cy="38" rx="9" ry="3.5" fill="#FFFFFF" opacity="0.35" />

      {/* Head, eyes and mouth palps */}
      <ellipse cx="50" cy="28" rx="8" ry="6" fill="#2A1204" />
      <ellipse cx="44.5" cy="26" rx="2.4" ry="3" fill="#120700" />
      <ellipse cx="55.5" cy="26" rx="2.4" ry="3" fill="#120700" />
      <circle cx="44" cy="25" r="0.8" fill="#fff" opacity="0.6" />
      <circle cx="55" cy="25" r="0.8" fill="#fff" opacity="0.6" />
      <path d="M47 33 L45 37 M53 33 L55 37" stroke="#2A1204" strokeWidth="1" strokeLinecap="round" />
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
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
    </div>
  );
}
/** A single, still-in-place cockroach (legs and antennae still move) for previews and settings screens. */
export function CockroachPreview() {
  return (
    <div className="w-full h-full animate-bug-vibrate">
      <RealisticCockroach />
    </div>
  );
}

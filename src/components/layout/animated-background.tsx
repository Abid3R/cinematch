/**
 * AnimatedBackground — fixed cinematic backdrop.
 *
 * Two overlapping radial gradients (brand red + accent violet) softly drift via
 * the `gradient-flow` keyframes baked into `tailwind.config.ts`. A grain
 * pattern and a vignette sit on top to give the dark theme texture so the page
 * never reads as a flat black slab. Everything is `pointer-events-none` and
 * `fixed inset-0 -z-10` so it only affects vibe, not interaction.
 */
"use client";

import { cn } from "@/utils/cn";

export interface AnimatedBackgroundProps {
  /** Optional intensity multiplier (0..1). Defaults to 1. */
  intensity?: number;
  className?: string;
}

export function AnimatedBackground({ intensity = 1, className }: AnimatedBackgroundProps) {
  // Clamp so a careless caller can't blow out the page.
  const i = Math.max(0, Math.min(1, intensity));

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg",
        className,
      )}
    >
      {/* Layer 1: brand-red aurora drifting across the top-left. */}
      <div
        className="absolute -left-[20%] -top-[20%] h-[60vh] w-[60vw] rounded-full blur-3xl will-change-transform animate-gradient-flow"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,45,85,0.28), rgba(255,45,85,0) 70%)",
          opacity: 0.85 * i,
        }}
      />

      {/* Layer 2: violet aurora drifting on the bottom-right, opposite phase. */}
      <div
        className="absolute -bottom-[25%] -right-[15%] h-[65vh] w-[65vw] rounded-full blur-3xl will-change-transform animate-gradient-flow"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.22), rgba(139,92,246,0) 70%)",
          opacity: 0.85 * i,
          animationDelay: "-6s",
        }}
      />

      {/* Layer 3: cyan accent on the mid-right for a 3-point lighting feel. */}
      <div
        className="absolute right-[10%] top-[30%] h-[35vh] w-[35vw] rounded-full blur-3xl will-change-transform animate-gradient-flow"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.10), rgba(34,211,238,0) 70%)",
          opacity: 0.7 * i,
          animationDelay: "-12s",
        }}
      />

      {/* Subtle film grain — 8x8 stippled noise rendered as an inline SVG data URI. */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          opacity: 0.08 * i,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Top fade to make the navbar's translucent shell sit cleanly. */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,7,11,0.85), rgba(7,7,11,0))",
        }}
      />

      {/* Bottom vignette pulls focus toward content. */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,11,0.95), rgba(7,7,11,0))",
        }}
      />
    </div>
  );
}

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Cinematic dark theme tokens
        bg: {
          DEFAULT: "#07070b",
          elevated: "#0d0d14",
          subtle: "#11111a",
        },
        surface: {
          DEFAULT: "rgba(255,255,255,0.04)",
          hover: "rgba(255,255,255,0.07)",
          active: "rgba(255,255,255,0.10)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        ink: {
          DEFAULT: "#f4f4f7",
          muted: "#a0a0b0",
          subtle: "#6b6b7b",
        },
        brand: {
          DEFAULT: "#ff2d55", // CineMatch cinematic red
          50: "#fff1f4",
          100: "#ffe2e8",
          200: "#ffc4d2",
          300: "#ff95ad",
          400: "#ff5d83",
          500: "#ff2d55",
          600: "#ed0e3b",
          700: "#c80631",
          800: "#a4082f",
          900: "#880a2c",
        },
        accent: {
          violet: "#8b5cf6",
          cyan: "#22d3ee",
          gold: "#fbbf24",
          emerald: "#10b981",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "display-1": ["clamp(2.5rem, 6vw, 5.5rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-2": ["clamp(2rem, 4vw, 3.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-3": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
        "2xl": "28px",
        "3xl": "36px",
      },
      boxShadow: {
        "glass-sm": "0 4px 24px rgba(0,0,0,0.35)",
        "glass-md": "0 12px 40px rgba(0,0,0,0.45)",
        "glass-lg": "0 24px 60px rgba(0,0,0,0.55)",
        glow: "0 0 40px rgba(255, 45, 85, 0.35)",
        "glow-violet": "0 0 60px rgba(139, 92, 246, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,45,85,0.25)" },
          "50%": { boxShadow: "0 0 50px rgba(255,45,85,0.55)" },
        },
        "gradient-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-in": "fade-in 320ms ease-out",
        "slide-up": "slide-up 420ms cubic-bezier(0.22, 1, 0.36, 1)",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "gradient-flow": "gradient-flow 8s ease infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

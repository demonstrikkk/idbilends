import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "hsl(var(--ink) / <alpha-value>)",
        navy: "hsl(var(--navy) / <alpha-value>)",
        workspace: "hsl(var(--workspace) / <alpha-value>)",
        ivory: "hsl(var(--ivory) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        subtle: "hsl(var(--subtle) / <alpha-value>)",
        panel: "hsl(var(--panel) / <alpha-value>)",
        panel2: "hsl(var(--panel2) / <alpha-value>)",
        line: "hsl(var(--line) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        cyan: "hsl(var(--cyan) / <alpha-value>)",
        amber: "hsl(var(--amber) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
        positive: "hsl(var(--positive) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        critical: "hsl(var(--critical) / <alpha-value>)",
        slate: "hsl(var(--muted) / <alpha-value>)",
        border: "hsl(var(--line) / <alpha-value>)",
        input: "hsl(var(--line) / <alpha-value>)",
        ring: "hsl(var(--cyan) / <alpha-value>)",
        background: "hsl(var(--workspace) / <alpha-value>)",
        foreground: "hsl(var(--ink) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--navy) / <alpha-value>)",
          foreground: "hsl(var(--ivory) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--subtle) / <alpha-value>)",
          foreground: "hsl(var(--ink) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          foreground: "hsl(var(--ivory) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--cyan) / <alpha-value>)",
          foreground: "hsl(var(--ivory) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--panel) / <alpha-value>)",
          foreground: "hsl(var(--ink) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--panel) / <alpha-value>)",
          foreground: "hsl(var(--ink) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        cockpit: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        cockpitLg: "0 8px 32px -4px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "slide-up": "slide-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;

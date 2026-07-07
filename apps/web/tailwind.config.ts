import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a", // slate-900
        navy: "#1e293b", // slate-800
        workspace: "#f8fafc", // slate-50
        ivory: "#fdfdfc",
        surface: "#ffffff",
        subtle: "#f1f5f9", // slate-100
        panel: "#ffffff",
        panel2: "#f1f5f9",
        line: "#e2e8f0", // slate-200
        muted: "#64748b", // slate-500
        cyan: "#0369a1", // sky-700
        amber: "#d97706", // amber-600
        danger: "#dc2626", // red-600
        positive: "#16a34a", // green-600
        warning: "#d97706",
        critical: "#dc2626",
        slate: "#64748b",
      },
      boxShadow: {
        cockpit: "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
      },
    }
  },
  plugins: []
};

export default config;

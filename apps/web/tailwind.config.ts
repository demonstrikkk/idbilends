import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1724",
        panel: "#122334",
        panel2: "#172a3d",
        line: "#284156",
        muted: "#8aa0b3",
        cyan: "#42d4c8",
        amber: "#f2b84b",
        danger: "#ef6b73"
      },
      boxShadow: {
        cockpit: "0 18px 55px rgba(1, 10, 18, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#faf9f7",
        surface: "#ffffff",
        ink: { DEFAULT: "#1c1c1c", soft: "#4b4f55", faint: "#6b7280" },
        line: { DEFAULT: "#e6e2dc", strong: "#d5d0c8" },
        navy: {
          DEFAULT: "#1e3a5f",
          deep: "#16304f",
          soft: "#35577f",
          tint: "#edf2f8",
          border: "#c9d8e8",
        },
        saffron: {
          DEFAULT: "#d97b26",
          deep: "#b85f12",
          tint: "#fdf3e7",
        },
        ok: { DEFAULT: "#1e7f4f", tint: "#e8f5ee" },
        warn: { DEFAULT: "#a05c0b", tint: "#fdf6ec" },
        danger: { DEFAULT: "#b42318", tint: "#fdeeec" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        devanagari: ["var(--font-devanagari)", "var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,28,28,0.05), 0 1px 3px rgba(28,28,28,0.04)",
        raised: "0 2px 6px rgba(28,28,28,0.07), 0 1px 2px rgba(28,28,28,0.04)",
        focus: "0 0 0 3px rgba(30,58,95,0.18)",
      },
      borderRadius: {
        card: "10px",
        control: "8px",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp .28s cubic-bezier(.22,.61,.36,1) both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

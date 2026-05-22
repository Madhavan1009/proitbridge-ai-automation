import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#071633",
          900: "#0b1d3f",
          800: "#102a55",
          700: "#19366b",
        },
        brand: {
          50: "#d9f8fd",
          100: "#bff0fb",
          200: "#8de4f7",
          300: "#5fd6f3",
          400: "#22d3ee",
          500: "#046bd2",
          600: "#045cb4",
          700: "#034a91",
          800: "#063b73",
          900: "#0b1d3f",
        },
        cyan: {
          100: "#d9f8fd",
          400: "#22d3ee",
          500: "#22d3ee",
        },
        risk: {
          high: "#ef4444",
          medium: "#f59e0b",
          low: "#22c55e",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #045cb4 0%, #046bd2 50%, #22d3ee 100%)",
        "brand-radial":
          "radial-gradient(circle at 20% 0%, rgba(34, 211, 238, 0.18), transparent 45%), radial-gradient(circle at 80% 100%, rgba(4, 107, 210, 0.22), transparent 45%)",
        "glass-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 60%)",
      },
      boxShadow: {
        glow: "0 0 35px -10px rgba(34, 211, 238, 0.45)",
        "glow-blue": "0 0 35px -10px rgba(4, 107, 210, 0.6)",
        card: "0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "flow-dash": "flow-dash 2s linear infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0.35)" },
          "50%": { boxShadow: "0 0 0 12px rgba(34, 211, 238, 0)" },
        },
        "flow-dash": {
          to: { strokeDashoffset: "-20" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

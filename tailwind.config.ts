import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#09090A", 900: "#0E0E10", 800: "#141417", 700: "#1B1B1F", 600: "#232328", 500: "#2E2E34" },
        bone: { DEFAULT: "#F5F5F2", muted: "#A6A6AD", dim: "#6E6E76" },
        gold: { DEFAULT: "#D6B36A", light: "#E8CF95", dark: "#A8873F" },
        signal: "#E5484D",
        pitch: "#3DD68C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "none" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        marquee: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
      },
      animation: {
        "fade-up": "fadeUp .7s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fadeIn .4s ease both",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

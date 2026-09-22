import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "../../packages/core/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans)", "Noto Sans Gujarati", "sans-serif"],
        serif: ["var(--font-noto-serif)", "Noto Serif Gujarati", "serif"],
        rasa: ["var(--font-rasa)", "Rasa", "serif"]
      },
      colors: {
        ink: "#172033",
        pearl: "#f7fbff",
        gold: "#b88931"
      }
    }
  },
  plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c0b1b",
        panel: "#17172d",
        panel2: "#1d1d36",
        line: "#30314c",
        brand: { DEFAULT: "#6046f5", 100: "#e7e3ff", 200: "#c4bcff", 300: "#9d91ff" },
        mint: "#48d597",
        pink: "#ed3e98"
      },
      boxShadow: { glow: "0 12px 36px rgba(96,70,245,.18)" }
    }
  },
  plugins: []
};

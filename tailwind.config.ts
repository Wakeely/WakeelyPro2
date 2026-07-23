import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["var(--font-arabic)", "Tahoma", "sans-serif"],
        latin: ["var(--font-latin)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

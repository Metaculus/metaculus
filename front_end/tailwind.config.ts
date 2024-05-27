import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

import { METAC_COLORS } from "./src/contants/colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        metac: METAC_COLORS,
      },
      fontFamily: {
        sans: [
          "var(--font-diatype-variable)",
          "var(--font-diatype)",
          ...defaultTheme.fontFamily.sans,
        ],
        serif: [
          "var(--font-source-serif-pro)",
          ...defaultTheme.fontFamily.serif,
        ],
        mono: ['"Ubuntu mono"', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
};
export default config;

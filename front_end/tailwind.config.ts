import containerQueries from "@tailwindcss/container-queries";
import { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

import { METAC_COLORS } from "./src/constants/colors";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: Object.assign({ xs: "480px", xxs: "400px" }, defaultTheme.screens),
    extend: {
      colors: METAC_COLORS,
      boxShadow: {
        dropdown: `2px 3px 10px -3px ${METAC_COLORS.gray[500]}`,
      },
      keyframes: {
        "loading-slide": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(-100%)" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "90%, 100%": { transform: "rotate(360deg)" },
        },
        "highlight-flash": {
          "0%": { backgroundColor: "rgb(196 180 255 / 0.5)" },
          "50%": { backgroundColor: "rgb(196 180 255 / 0.8)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
      animation: {
        "loading-slide":
          "loading-slide cubic-bezier(0.3, 1, 0.7, 0) 1.7s infinite",
        spin: "spin 1s infinite",
        "highlight-flash": "highlight-flash 2s ease-out forwards",
      },
      fontFamily: {
        sans: [
          "var(--font-inter-variable)",
          "var(--font-inter)",
          ...defaultTheme.fontFamily.sans,
        ],
        serif: [
          "var(--font-source-serif-pro)",
          ...defaultTheme.fontFamily.serif,
        ],
        mono: ['"Ubuntu mono"', ...defaultTheme.fontFamily.mono],
        "league-gothic": "var(--font-league-gothic)",
      },
      strokeWidth: {
        "3": "3px",
      },
      scrollMargin: {
        nav: "70px",
      },
      zIndex: {
        "100": "100",
      },
      backgroundImage: {
        "border-dashed-1":
          "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%23A9C0D6FF' stroke-width='1' stroke-dasharray='4%2c 6' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",
        "border-dashed-1-dark":
          "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='4' ry='4' stroke='%236387A8FF' stroke-width='1' stroke-dasharray='4%2c 6' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",
      },
      spacing: {
        header: "3rem",
      },
      borderRadius: {
        xs: "2px",
      },
    },
  },
  plugins: [
    containerQueries,
    // @ts-ignore
    function ({ addVariant }) {
      addVariant("no-hover", "@media (hover: none)");
      addVariant("can-hover", "@media (hover: hover)");
    },
    // @ts-ignore
    plugin(function ({ addUtilities }) {
      addUtilities({
        /* https://github.com/tailwindlabs/tailwindcss/pull/12128 */
        ".break-anywhere": {
          "overflow-wrap": "anywhere",
        },
        /* Hide scrollbar for Chrome, Safari and Opera */
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
        /* Hide scrollbar for IE, Edge and Firefox */
        ".no-scrollbar": {
          "-ms-overflow-style": "none" /* IE and Edge */,
          "scrollbar-width": "none" /* Firefox */,
        },
        ".fill-opacity-50": {
          "fill-opacity": "0.5",
        },
        ".list-lower-alpha": {
          "list-style-type": "lower-alpha",
        },
        ".list-lower-roman": {
          "list-style-type": "lower-roman",
        },
        ".text-xs": {
          "text-rendering": "geometricPrecision",
        },
      });
    }),
  ],
};
export default config;

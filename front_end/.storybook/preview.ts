import type { Preview } from "@storybook/nextjs";
import "../src/app/globals.css";
import "./styles.css";
import { withThemeByClassName } from "@storybook/addon-themes";
import localFont from "next/font/local";
import { ComponentType } from "react";

const sourceSerifPro = localFont({
  src: [
    {
      path: "../../public/fonts/SourceSerifPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-source-serif-pro",
  display: "swap",
  preload: false,
});

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter_18pt-medium.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter_18pt-mediumitalic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const interVariable = localFont({
  src: [
    {
      path: "../../public/fonts/inter_variable.ttf",
      weight: "100 700",
      style: "normal",
    },
  ],
  variable: "--font-inter-variable",
  display: "swap",
  preload: false,
});

const leagueGothic = localFont({
  src: "../../public/fonts/league_gothic_variable.ttf",
  variable: "--font-league-gothic",
  display: "swap",
  preload: false,
});
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        dark: { name: "dark", value: "rgb(38, 47, 56)" },
        light: { name: "light", value: "rgb(255, 255, 255)" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "light" },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark bg-gray-0-dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;

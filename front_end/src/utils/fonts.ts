import localFont from "next/font/local";

export const sourceSerifPro = localFont({
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

export const inter = localFont({
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

export const interVariable = localFont({
  src: [
    {
      path: "../../public/fonts/inter_variable.ttf",
      weight: "100 800",
      style: "normal",
    },
  ],
  variable: "--font-inter-variable",
  display: "swap",
  preload: false,
});

export const leagueGothic = localFont({
  src: "../../public/fonts/league_gothic_variable.ttf",
  variable: "--font-league-gothic",
  display: "swap",
  preload: false,
});

export const getFontsString = () => {
  return `${interVariable.variable} ${inter.variable} ${sourceSerifPro.variable} ${leagueGothic.variable}`;
};

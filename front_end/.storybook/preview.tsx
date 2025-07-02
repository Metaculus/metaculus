import type { Preview } from "@storybook/nextjs";
import "../src/app/globals.css";
import "./styles.css";
import { withThemeByClassName } from "@storybook/addon-themes";
import React, { ComponentType, useEffect } from "react";
import { getFontsString } from "../src/utils/fonts";
import { ThemeProvider } from "next-themes";
import useAppTheme from "../src/hooks/use_app_theme";

const withAppTheme = (Story: ComponentType, context: any) => {
  const { setTheme } = useAppTheme();

  useEffect(() => {
    setTheme(context.globals.theme === "light" ? "light" : "dark");
  }, [context.globals.theme]);

  return <Story />;
};

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
    withAppTheme,
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark bg-gray-0-dark",
      },
      defaultTheme: "light",
    }),
    (Story: ComponentType) => (
      <ThemeProvider>
        <div className={`${getFontsString()} font-sans`}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;

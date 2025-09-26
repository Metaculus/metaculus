import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";
import "./styles.css";
import { withThemeByClassName } from "@storybook/addon-themes";
import React, { ComponentType, useEffect } from "react";
import { getFontsString } from "../src/utils/fonts";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import useAppTheme from "../src/hooks/use_app_theme";
import defaultMessages from "../messages/en.json";

const withAppTheme = (Story: ComponentType, context: any) => {
  const { setTheme } = useAppTheme();

  useEffect(() => {
    setTheme(context.globals.theme === "dark" ? "dark" : "light");
  }, [context.globals.theme]);

  return <Story />;
};

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
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
        light: "light bg-gray-0",
        dark: "dark bg-gray-0-dark",
      },
      defaultTheme: "light",
    }),
    (Story: ComponentType) => (
      <NextIntlClientProvider locale="en" messages={defaultMessages}>
        <ThemeProvider>
          <div className={`${getFontsString()} font-sans`}>
            <Story />
          </div>
        </ThemeProvider>
      </NextIntlClientProvider>
    ),
  ],
};

export default preview;

import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-themes"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public", { from: "../public/fonts", to: "/fonts" }],
  viteFinal: async (viteConfig) => {
    viteConfig.build = {
      ...viteConfig.build,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("question_view")) return "questionViews";
            if (id.includes("question_layout")) return "questionLayouts";
          },
        },
      },
    };
    return viteConfig;
  },
};
export default config;

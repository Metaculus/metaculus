import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";
import storybook from "eslint-plugin-storybook";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      // React Compiler rules from eslint-config-next v16 — downgrade to warn
      // so existing code doesn't block CI. Fix these incrementally.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "prefer-const": [
        "error",
        {
          destructuring: "all",
        },
      ],
      "import/order": [
        "error",
        {
          groups: [
            ["builtin", "external"],
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      ".lintstagedrc.js",
      "commitlint.config.js",
      "next-env.d.ts",
      "tailwind.config.ts",
      "postcss.config.js",
      "eslint.config.mjs",
      "next.config.mjs",
      "global.d.ts",
      ".storybook/",
    ],
  },
];

export default eslintConfig;

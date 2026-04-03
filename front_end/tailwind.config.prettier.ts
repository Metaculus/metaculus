import { Config } from "tailwindcss";

import originalConfig from "./tailwind.config";

/*
  This configuration file is added specifically because we have customized
  the dark mode variant in our Tailwind configuration but we don't want to
  change the class order across the codebase.

  This file helps to ensure that Tailwind CSS classes are sorted and applied
  in the expected order like before the change.

  When Tailwind CSS / Prettier are updated or repo-wide class changes are made
  it's safe to remove this file (and configuration in .prettierrc.json) to
  re-sort all the classes in the files.
*/

const config: Config = {
  ...originalConfig,
  darkMode: ["class"],
};

export default config;

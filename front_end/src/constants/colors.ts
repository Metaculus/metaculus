export const METAC_COLORS = {
  gray: {
    0: { DEFAULT: "#ffffff", dark: "#262f38" },
    100: { DEFAULT: "#fbfbfc", dark: "#2d3845" },
    200: { DEFAULT: "#f7f7f8", dark: "#394450" },
    300: { DEFAULT: "#e0e0e1", dark: "#626971" },
    400: { DEFAULT: "#c8ccce", dark: "#848b91" },
    500: { DEFAULT: "#91999e", dark: "#969b98" },
    600: { DEFAULT: "#777777", dark: "#adb1b4" },
    700: { DEFAULT: "#555555", dark: "#bdc0c2" },
    800: { DEFAULT: "#2d2e2e", dark: "#e4e7e9" },
    900: { DEFAULT: "#161c22", dark: "#fffdfb" },
    1000: { DEFAULT: "#000000", dark: "#ffffff" },
  },
  blue: {
    50: { dark: "#22262b" }, // body background, not in design system
    100: { DEFAULT: "#f9fbfb", dark: "#2c3947" },
    200: { DEFAULT: "#eff4f4", dark: "#2f4155" },
    300: { DEFAULT: "#eaf4ff", dark: "#3d5166" },
    400: { DEFAULT: "#d7e4f2", dark: "#58718c" },
    500: { DEFAULT: "#a9c0d6", dark: "#6387a8" },
    600: { DEFAULT: "#758ea9", dark: "#718ea8" },
    700: { DEFAULT: "#4f6882", dark: "#bfd4ec" },
    800: { DEFAULT: "#2f4155", dark: "#d7e7f7" },
    900: { DEFAULT: "#283441", dark: "#ebf5fe" },
    950: { DEFAULT: "#22262B", dark: "#22262B" },
  },
  olive: {
    100: { DEFAULT: "#f9fbf9", dark: "#2a332a" },
    300: { DEFAULT: "#e0e9e0", dark: "#304a32" },
    400: { DEFAULT: "#c7ebc7", dark: "#345540" },
    500: { DEFAULT: "#9fd19f", dark: "#6fa172" },
    600: { DEFAULT: "#98ab98", dark: "#7dad80" },
    700: { DEFAULT: "#748c74", dark: "#9fc7a2" },
    800: { DEFAULT: "#607560", dark: "#c2dfc4" },
    900: { DEFAULT: "#384f38", dark: "#e6f6e7" },
  },
  mint: {
    200: { DEFAULT: "#edf7f3", dark: "#2d403a" },
    300: { DEFAULT: "#e3ffef", dark: "#405c53" },
    400: { DEFAULT: "#c7ebd8", dark: "#80a398" },
    500: { DEFAULT: "#9fd1bc", dark: "#9fd1bc" },
    700: { DEFAULT: "#80a398", dark: "#c7ebd8" },
    800: { DEFAULT: "#405c53", dark: "#e3ffef" },
    900: { DEFAULT: "#2d403a", dark: "#edf7f3" },
  },
  orange: {
    100: { DEFAULT: "#feebd9", dark: "#4d360e" },
    200: { DEFAULT: "#fad8b8", dark: "#79521d" },
    300: { DEFAULT: "#f2c59a", dark: "#9f6c31" },
    400: { DEFAULT: "#e7b27f", dark: "#bf864a" },
    500: { DEFAULT: "#d99f68", dark: "#d99f68" },
    600: { DEFAULT: "#bf864a", dark: "#e7b27f" },
    700: { DEFAULT: "#9f6c31", dark: "#f2c59a" },
    800: { DEFAULT: "#79521d", dark: "#fad8b8" },
    900: { DEFAULT: "#4d360e", dark: "#feebd9" },
  },
  purple: {
    100: { DEFAULT: "#f1edf7", dark: "#3c2b45" },
    200: { DEFAULT: "#e4dcee", dark: "#5e476c" },
    300: { DEFAULT: "#d7cbe6", dark: "#7e6691" },
    400: { DEFAULT: "#cabade", dark: "#9d86b5" },
    500: { DEFAULT: "#bda9d6", dark: "#bda9d6" },
    600: { DEFAULT: "#9d86b5", dark: "#cabade" },
    700: { DEFAULT: "#7e6691", dark: "#d7cbe6" },
    800: { DEFAULT: "#5e476c", dark: "#e4dcee" },
    900: { DEFAULT: "#3c2b45", dark: "#f1edf7" },
  },
  salmon: {
    100: { DEFAULT: "#fef6f6", dark: "#753e3e" },
    200: { DEFAULT: "#fc3838", dark: "#904747" },
    300: { DEFAULT: "#f9d2d2", dark: "#ab5959" },
    400: { DEFAULT: "#f3b4b4", dark: "#c56d6d" },
    500: { DEFAULT: "#d89292", dark: "#d89292" },
    600: { DEFAULT: "#c56d6d", dark: "#f3b4b4" },
    700: { DEFAULT: "#ab5959", dark: "#f9d2d2" },
    800: { DEFAULT: "#904747", dark: "#fce8e8" },
  },
  tan: {
    500: { DEFAULT: "#d6cca9", dark: "#d6cca9" },
    700: { DEFAULT: "#a89b82", dark: "#d1c4a9" },
  },
  clay: {
    400: { DEFAULT: "#edd1c5", dark: "#ebcccc" },
    700: { DEFAULT: "#a88282", dark: "#b08f8f" },
  },
  fuchsia: {
    500: { DEFAULT: "#e58eed", dark: "#e58eed" },
    700: { DEFAULT: "#c791cc", dark: "#c791cc" },
  },
  gold: {
    200: { DEFAULT: "#f8f4d0", dark: "#78755d" },
    500: { DEFAULT: "#ffa500", dark: "#ffa500" },
  },
  red: {
    500: { DEFAULT: "#a80000", dark: "#fc4141" },
  },
  green: {
    200: { DEFAULT: "#8ccc8c", dark: "#006c00" },
    500: { DEFAULT: "#00a800", dark: "#00a800" },
    800: { DEFAULT: "#006c00", dark: "#8ccc8c" },
  },
  "conditional-green": {
    500: { DEFAULT: "#00e109", dark: "#00e109" },
    700: { DEFAULT: "#00b807", dark: "#00b807" },
  },
  "conditional-blue": {
    500: { DEFAULT: "#1f44ff", dark: "#0b98ff" },
    700: { DEFAULT: "#0020c0", dark: "#006fd6" },
  },
  result: {
    unlikely: { DEFAULT: "#f1d4d4", dark: "#917b84" },
    likely: { DEFAULT: "#c7e3c9", dark: "#67897a" },
    negative: { DEFAULT: "#ff0000", dark: "#ff5c5c" },
    positive: { DEFAULT: "#1aaf00", dark: "#54c340" },
  },
  level: {
    1: { DEFAULT: "#fdfdfd", dark: "#263038" },
    2: { DEFAULT: "#e7f1e8", dark: "#303e43" },
    3: { DEFAULT: "#deeddf", dark: "#324447" },
    4: { DEFAULT: "#d7e9d8", dark: "#34484b" },
    5: { DEFAULT: "#d1e6d2", dark: "#384e4e" },
    6: { DEFAULT: "#cce4cc", dark: "#3b5351" },
    7: { DEFAULT: "#c7e2c8", dark: "#405955" },
    8: { DEFAULT: "#c2e0c3", dark: "#455f59" },
    9: { DEFAULT: "#bedebf", dark: "#49655c" },
    10: { DEFAULT: "#bbdcbb", dark: "#4c6a5f" },
    11: { DEFAULT: "#b7dab7", dark: "#4f7062" },
    12: { DEFAULT: "#b3d9b3", dark: "#527565" },
    13: { DEFAULT: "#b0d8b0", dark: "#567967" },
    14: { DEFAULT: "#acd7ac", dark: "#597e69" },
    15: { DEFAULT: "#a9d5a9", dark: "#5c836b" },
    16: { DEFAULT: "#a6d4a6", dark: "#5f876d" },
    17: { DEFAULT: "#a3d2a3", dark: "#618c6e" },
    18: { DEFAULT: "#a0d1a0", dark: "#649070" },
    staff: { DEFAULT: "#758EA9", dark: "#6E8CA7" },
    "∞": { DEFAULT: "#758EA9", dark: "#6E8CA7" },
    linear: { DEFAULT: "#C7EBC7", dark: "#4A5D59" },
  },
  score: {
    green: { DEFAULT: "#c7e3c9", dark: "#c7e3c9" },
    orange: { DEFAULT: "#c7995d", dark: "#c7995d" },
    negative: { DEFAULT: "#f1d4d4", dark: "#f1d4d4" },
  },
  "mc-option": {
    1: { DEFAULT: "#1f44ff", dark: "#3758ff" },
    2: { DEFAULT: "#f25f5c", dark: "#ff4642" },
    3: { DEFAULT: "#09bc8a", dark: "#19d8a2" },
    4: { DEFAULT: "#6cd4ff", dark: "#6cd4ff" },
    5: { DEFAULT: "#ffbc0a", dark: "#ffc630" },
    6: { DEFAULT: "#007930", dark: "#2aa728" },
    7: { DEFAULT: "#9400b9", dark: "#9725b4" },
    8: { DEFAULT: "#ff44ff", dark: "#ff44ff" },
    9: { DEFAULT: "#9a7000", dark: "#be8900" },
    10: { DEFAULT: "#053225", dark: "#1d6852" },
    11: { DEFAULT: "#ff7000", dark: "#ff7000" },
    12: { DEFAULT: "#ffbc8a", dark: "#ffbc8a" },
    13: { DEFAULT: "#aab43b", dark: "#aab43b" },
    14: { DEFAULT: "#030094", dark: "#a2a0ff" },
    15: { DEFAULT: "#996e99", dark: "#996e99" },
    16: { DEFAULT: "#8da7bf", dark: "#bbdeff" },
    17: { DEFAULT: "#81bb8b", dark: "#81bb8b" },
    18: { DEFAULT: "#ec0000", dark: "#ec0000" },
  },
  bell: { DEFAULT: "#b79d00", dark: "#dac024" },
  twitter: { DEFAULT: "#1da1f2" },
} as const;

export const MULTIPLE_CHOICE_COLOR_SCALE = Object.values(
  METAC_COLORS["mc-option"]
).map((value) => value);

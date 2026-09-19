import { METAC_COLORS } from "@/constants/colors";

const LIGHT_FOREGROUND = METAC_COLORS.gray["0"].DEFAULT;
const DARK_FOREGROUND = METAC_COLORS.blue["900"].DEFAULT;

export const DEFAULT_INITIATIVE_COLOR = METAC_COLORS.blue["800"].DEFAULT;

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function getReadableForeground(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;

  const red = parseInt(full.slice(0, 2), 16);
  const green = parseInt(full.slice(2, 4), 16);
  const blue = parseInt(full.slice(4, 6), 16);

  if ([red, green, blue].some(Number.isNaN)) return LIGHT_FOREGROUND;

  const luminance =
    0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

  return luminance > 0.4 ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

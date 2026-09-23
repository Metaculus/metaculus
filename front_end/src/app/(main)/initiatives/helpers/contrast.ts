import { METAC_COLORS } from "@/constants/colors";

const LIGHT_FOREGROUND = METAC_COLORS.gray["0"].DEFAULT;
const DARK_FOREGROUND = METAC_COLORS.blue["900"].DEFAULT;
const TILE_SURFACE = METAC_COLORS.gray["0"].DEFAULT;
const MIN_ACCENT_CONTRAST = 4.5;

export const DEFAULT_INITIATIVE_COLOR = METAC_COLORS.blue["800"].DEFAULT;
export const INITIATIVE_TILE_TINT = 0.15;

type Rgb = [number, number, number];

const BLACK: Rgb = [0, 0, 0];

function parseHex(color: string): Rgb | null {
  const hex = color.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((character) => character + character)
          .join("")
      : hex;

  const rgb: Rgb = [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];

  return rgb.some(Number.isNaN) ? null : rgb;
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(color: Rgb, base: Rgb, weight: number): Rgb {
  return color.map(
    (channel, index) => channel * weight + (base[index] ?? 0) * (1 - weight)
  ) as Rgb;
}

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

function getLuminance([red, green, blue]: Rgb): number {
  return (
    0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue)
  );
}

function getContrastRatio(first: Rgb, second: Rgb): number {
  const [lighter, darker] = [getLuminance(first), getLuminance(second)].sort(
    (a, b) => b - a
  ) as [number, number];

  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableForeground(backgroundColor: string): string {
  const rgb = parseHex(backgroundColor);
  if (!rgb) return LIGHT_FOREGROUND;

  return getLuminance(rgb) > 0.4 ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

const accentCache = new Map<string, string>();

// Darkens a category colour until it reads at WCAG AA on its own light tile
// (the colour at INITIATIVE_TILE_TINT over the page surface).
export function getAccessibleAccent(color: string): string {
  const cached = accentCache.get(color);
  if (cached) return cached;

  const rgb = parseHex(color);
  const surface = parseHex(TILE_SURFACE);
  if (!rgb || !surface) return color;

  const tile = mix(rgb, surface, INITIATIVE_TILE_TINT);
  let accent = rgb;
  for (
    let step = 1;
    step <= 100 && getContrastRatio(accent, tile) < MIN_ACCENT_CONTRAST;
    step++
  ) {
    accent = mix(BLACK, rgb, step / 100);
  }

  const result = toHex(accent);
  accentCache.set(color, result);
  return result;
}

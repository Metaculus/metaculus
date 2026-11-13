import { YEAR_MAX, YEAR_MIN } from "./forecast";
import { AREA_ORDER, AREA_PALETTES, Rgb } from "../data/area_sections";
import { WorldArea } from "../data/questions";

export type PageSection = "hero" | "overview" | WorldArea;

export const PAGE_SECTIONS: PageSection[] = ["hero", "overview", ...AREA_ORDER];

export const YEARS = Array.from(
  { length: YEAR_MAX - YEAR_MIN + 1 },
  (_, i) => YEAR_MIN + i
);

const PAGE_PALETTE: [Rgb, Rgb, Rgb] = [
  [82, 207, 160],
  [90, 169, 242],
  [240, 140, 196],
];
const DARK_PAGE: Rgb = [34, 38, 46];
const WHITE: Rgb = [255, 255, 255];
const KNOCKOUT_CELLS = [
  [7, 7],
  [6, 7],
  [7, 6],
  [5, 7],
  [7, 5],
] as const;

// Null colours are cells knocked out to the page background.
export type TileCell = {
  x: number;
  y: number;
  dark: string | null;
  light: string | null;
};

const mix = (a: Rgb, b: Rgb, k: number): Rgb => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

const rgb = (color: Rgb) => `rgb(${color.join(",")})`;

// An 8x8 crop of a section's pixel band in its own palette, with a few cells
// breaking in from one corner the way the dither edge does.
const buildTile = (section: PageSection, seed: number): TileCell[] => {
  const palette =
    section === "hero" || section === "overview"
      ? PAGE_PALETTE
      : AREA_PALETTES[section];
  let state = seed * 9301 + 49297;
  const random = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  const phase = random() * 6;
  const corner = Math.floor(random() * 4);
  const knocked = new Set(
    KNOCKOUT_CELLS.slice(0, 3 + Math.floor(random() * 3)).map(
      ([x, y]) => `${corner & 1 ? 7 - x : x},${corner & 2 ? 7 - y : y}`
    )
  );
  const cells: TileCell[] = [];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (knocked.has(`${x},${y}`)) {
        cells.push({ x, y, dark: null, light: null });
        continue;
      }
      const k = Math.max(
        0,
        Math.min(1, (x + 1.2 * Math.sin(y * 0.7 + phase)) / 7.5)
      );
      const color =
        k < 0.5
          ? mix(palette[0], palette[1], k * 2)
          : mix(palette[1], palette[2], (k - 0.5) * 2);
      const jitter = random();
      const shade = random();
      const dark = mix(color, DARK_PAGE, 0.24 + jitter * 0.12).map((n) =>
        Math.round(n * (0.92 + shade * 0.12))
      ) as Rgb;
      const light = mix(color, WHITE, 0.1 + jitter * 0.14).map((n) =>
        Math.round(Math.min(255, n * (0.97 + shade * 0.06)))
      ) as Rgb;
      cells.push({ x, y, dark: rgb(dark), light: rgb(light) });
    }
  }
  return cells;
};

export const SECTION_TILES = Object.fromEntries(
  PAGE_SECTIONS.map((section, i) => [section, buildTile(section, i * 7 + 3)])
) as Record<PageSection, TileCell[]>;

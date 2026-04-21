import { METAC_COLORS } from "@/constants/colors";

type RGBColor = [number, number, number];

const DEFAULT_CONTRAST_TEXT_COLORS = [
  METAC_COLORS.gray["0"].DEFAULT,
  METAC_COLORS.gray["900"].DEFAULT,
] as const;

const APCA_CONSTANTS = {
  mainTRC: 2.4,
  sRco: 0.2126729,
  sGco: 0.7151522,
  sBco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
} as const;

export function rgbToHex(rgb: RGBColor): string {
  return (
    "#" +
    rgb
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

export function getColorInSpectrum(
  startColor: RGBColor,
  midColor: RGBColor,
  endColor: RGBColor,
  value: number
): string {
  startColor = value < 0.5 ? startColor : midColor;
  endColor = value < 0.5 ? midColor : endColor;
  value = value < 0.5 ? value : value - 0.5;

  const result = startColor.map((c1, i) =>
    // okay to do no-non-null-assertion, as both startColor and endColor are tuples of 3 numbers
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Math.round(c1 + (endColor[i]! - c1) * value * 2)
  ) as RGBColor;

  return rgbToHex(result);
}

export function addOpacityToHex(hex: string, opacity: number) {
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${alpha}`;
}

/** Parses `#RGB` / `#RRGGBB` (with optional leading `#`). Returns null if not a 6-digit hex. */
export function parseHexColor(color: string): RGBColor | null {
  const normalizedColor = color.replace("#", "");
  const hex =
    normalizedColor.length === 3
      ? normalizedColor
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalizedColor;

  if (hex.length !== 6) {
    return null;
  }

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  if ([red, green, blue].some(Number.isNaN)) {
    return null;
  }

  return [red, green, blue];
}

const getRelativeLuminance = ([red, green, blue]: RGBColor) => {
  const toLinear = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue)
  );
};

/** WCAG 2.1 relative luminance contrast ratio for two `#RRGGBB` colors. */
export function getContrastRatio(
  foregroundColor: string,
  backgroundColor: string
): number {
  const foreground = parseHexColor(foregroundColor);
  const background = parseHexColor(backgroundColor);

  if (!foreground || !background) {
    return 0;
  }

  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

const sRGBtoY = (rgb: RGBColor) => {
  const toGammaLinear = (channel: number) =>
    Math.pow(channel / 255, APCA_CONSTANTS.mainTRC);

  return (
    APCA_CONSTANTS.sRco * toGammaLinear(rgb[0]) +
    APCA_CONSTANTS.sGco * toGammaLinear(rgb[1]) +
    APCA_CONSTANTS.sBco * toGammaLinear(rgb[2])
  );
};

const getAPCAContrast = (
  foregroundColor: string,
  backgroundColor: string
): number => {
  const foreground = parseHexColor(foregroundColor);
  const background = parseHexColor(backgroundColor);

  if (!foreground || !background) {
    return 0;
  }

  let txtY = sRGBtoY(foreground);
  let bgY = sRGBtoY(background);

  if (txtY <= APCA_CONSTANTS.blkThrs) {
    txtY += Math.pow(APCA_CONSTANTS.blkThrs - txtY, APCA_CONSTANTS.blkClmp);
  }
  if (bgY <= APCA_CONSTANTS.blkThrs) {
    bgY += Math.pow(APCA_CONSTANTS.blkThrs - bgY, APCA_CONSTANTS.blkClmp);
  }

  if (Math.abs(bgY - txtY) < APCA_CONSTANTS.deltaYmin) {
    return 0;
  }

  if (bgY > txtY) {
    const sapc =
      (Math.pow(bgY, APCA_CONSTANTS.normBG) -
        Math.pow(txtY, APCA_CONSTANTS.normTXT)) *
      APCA_CONSTANTS.scaleBoW;
    const outputContrast =
      sapc < APCA_CONSTANTS.loClip ? 0 : sapc - APCA_CONSTANTS.loBoWoffset;
    return outputContrast * 100;
  }

  const sapc =
    (Math.pow(bgY, APCA_CONSTANTS.revBG) -
      Math.pow(txtY, APCA_CONSTANTS.revTXT)) *
    APCA_CONSTANTS.scaleWoB;
  const outputContrast =
    sapc > -APCA_CONSTANTS.loClip ? 0 : sapc + APCA_CONSTANTS.loWoBoffset;
  return outputContrast * 100;
};

/**
 * Picks the candidate text color with the highest APCA contrast against `backgroundColor`.
 * When `candidateTextColors` is omitted or empty, uses `METAC_COLORS.gray[0].DEFAULT` and
 * `METAC_COLORS.gray[900].DEFAULT` as candidates.
 */
export function pickHighestContrastTextColor(
  backgroundColor: string,
  candidateTextColors: readonly string[] = []
): string {
  const candidates =
    candidateTextColors.length > 0
      ? candidateTextColors
      : DEFAULT_CONTRAST_TEXT_COLORS;

  const first = candidates[0];
  if (first === undefined) {
    return METAC_COLORS.gray["900"].DEFAULT;
  }

  let best = first;
  let bestContrast = Math.abs(getAPCAContrast(best, backgroundColor));

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate === undefined) {
      continue;
    }
    const contrast = Math.abs(getAPCAContrast(candidate, backgroundColor));
    if (contrast > bestContrast) {
      best = candidate;
      bestContrast = contrast;
    }
  }

  return best;
}

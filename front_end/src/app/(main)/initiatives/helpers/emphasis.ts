import { CSSProperties } from "react";

export const DESIGN_MARK_SIZE = 200;

const STEPS = [
  { scale: 1, blur: 0, opacity: 1, shift: 0 },
  { scale: 0.72, blur: 10, opacity: 0.72, shift: 0 },
  { scale: 0.52, blur: 15, opacity: 0.45, shift: 48 },
];

type Emphasis = {
  blur: string;
  scale: string;
  opacity: string;
  shift: string;
};

function getEmphasis(distance: number, markRatio: number): Emphasis {
  const lastIndex = STEPS.length - 1;
  const clamped = Math.min(Math.abs(distance), lastIndex);
  const index = Math.min(Math.floor(clamped), lastIndex);
  const from = STEPS[index];
  const to = STEPS[Math.min(index + 1, lastIndex)];

  if (!from || !to) {
    return { blur: "0px", scale: "1", opacity: "1", shift: "0px" };
  }

  const progress = clamped - index;
  const lerp = (a: number, b: number) => a + (b - a) * progress;
  const towardCentre = distance > 0 ? -1 : 1;

  return {
    blur: `${(lerp(from.blur, to.blur) * markRatio).toFixed(2)}px`,
    scale: lerp(from.scale, to.scale).toFixed(3),
    opacity: lerp(from.opacity, to.opacity).toFixed(3),
    shift: `${(lerp(from.shift, to.shift) * markRatio * towardCentre).toFixed(2)}px`,
  };
}

export function getEmphasisStyle(distance: number): CSSProperties {
  const { blur, scale, opacity, shift } = getEmphasis(distance, 1);

  return {
    "--initiative-blur": blur,
    "--initiative-scale": scale,
    "--initiative-opacity": opacity,
    "--initiative-shift": shift,
  } as CSSProperties;
}

export function applyEmphasis(
  element: HTMLElement,
  distance: number,
  markRatio: number
): void {
  const { blur, scale, opacity, shift } = getEmphasis(distance, markRatio);

  element.style.setProperty("--initiative-blur", blur);
  element.style.setProperty("--initiative-scale", scale);
  element.style.setProperty("--initiative-opacity", opacity);
  element.style.setProperty("--initiative-shift", shift);
}

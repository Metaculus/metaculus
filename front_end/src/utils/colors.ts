type RGBColor = [number, number, number];

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
    Math.round(c1 + (endColor[i] - c1) * value * 2)
  ) as RGBColor;

  return rgbToHex(result);
}

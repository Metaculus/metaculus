import { getBinaryGaugeColors } from "@/utils/colors/binary_gauge_colors";

const SCALE = 288 / 112;
const WIDTH = 288;
const HEIGHT = Math.round(66 * SCALE);

const STROKE_WIDTH = 12 * SCALE;
const RADIUS = ((112 - 12) / 2) * SCALE;
const CENTER_X = WIDTH / 2;
const CENTER_Y = (66 - 12) * SCALE;
const ARC_ANGLE = Math.PI * 1.1;
const FONT_FAMILY = "Inter, system-ui, sans-serif";

const PERCENT_CENTER_Y = 38 * SCALE;
const CHANCE_CENTER_Y = 60 * SCALE;
const PERCENT_FONT_SIZE = 24 * SCALE;
const CHANCE_FONT_SIZE = 12 * SCALE;

function describeArc(
  percentage: number,
  isLargerFlag: 0 | 1
): { path: string; endX: number; endY: number; endAngle: number } {
  const startAngle = Math.PI - (ARC_ANGLE - Math.PI) / 2;
  const endAngle = startAngle + (percentage / 100) * ARC_ANGLE;
  const startX = CENTER_X + RADIUS * Math.cos(startAngle);
  const startY = CENTER_Y + RADIUS * Math.sin(startAngle);
  const endX = CENTER_X + RADIUS * Math.cos(endAngle);
  const endY = CENTER_Y + RADIUS * Math.sin(endAngle);

  return {
    path: `M ${startX} ${startY} A ${RADIUS} ${RADIUS} 0 ${isLargerFlag} 1 ${endX} ${endY}`,
    endX,
    endY,
    endAngle,
  };
}

export function generateRadialGaugeSvg(
  cpPercentage: number,
  isClosed: boolean
): string {
  const { hex } = getBinaryGaugeColors(cpPercentage, isClosed);

  const backgroundArc = describeArc(100, 1);
  const progressArc =
    cpPercentage > 0
      ? describeArc(cpPercentage, cpPercentage > 90 ? 1 : 0)
      : null;

  const startAngle = Math.PI - (ARC_ANGLE - Math.PI) / 2;
  const endAngle = startAngle + (cpPercentage / 100) * ARC_ANGLE;
  const gradStartX = CENTER_X + RADIUS * Math.cos(startAngle);
  const gradStartY = CENTER_Y + RADIUS * Math.sin(startAngle);
  const gradEndX = CENTER_X + RADIUS * Math.cos(endAngle);
  const gradEndY = CENTER_Y + RADIUS * Math.sin(endAngle);
  const gradientStopPercent = Math.min(100, (cpPercentage / 15) * 100);

  const displayValue = `${Math.round(cpPercentage * 10) / 10}%`;

  const tickSvg = progressArc
    ? (() => {
        const a = progressArc.endAngle;
        const perpX = Math.cos(a + Math.PI / 2);
        const perpY = Math.sin(a + Math.PI / 2);
        const radX = Math.cos(a);
        const radY = Math.sin(a);
        const halfW = 5;
        const outerR = RADIUS + STROKE_WIDTH / 2 + 2;
        const innerR = RADIUS - STROKE_WIDTH / 2 - 2;
        const ox = CENTER_X + outerR * radX;
        const oy = CENTER_Y + outerR * radY;
        const ix = CENTER_X + innerR * radX;
        const iy = CENTER_Y + innerR * radY;
        return `<path fill-rule="evenodd" clip-rule="evenodd" d="M${ox - halfW * perpX} ${oy - halfW * perpY}L${ox + halfW * perpX} ${oy + halfW * perpY}L${ix + halfW * perpX} ${iy + halfW * perpY}L${ix - halfW * perpX} ${iy - halfW * perpY}Z" fill="${hex}"/>`;
      })()
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <defs>
    <linearGradient id="radialGrad" x1="${gradStartX}" y1="${gradStartY}" x2="${gradEndX}" y2="${gradEndY}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${hex}" stop-opacity="0"/>
      <stop offset="${gradientStopPercent}%" stop-color="${hex}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <path d="${backgroundArc.path}" fill="none" stroke="${hex}" stroke-opacity="0.15" stroke-width="${STROKE_WIDTH}"/>
  ${progressArc ? `<path d="${progressArc.path}" fill="none" stroke="url(#radialGrad)" stroke-width="${STROKE_WIDTH}"/>` : ""}
  ${tickSvg}
  <text x="${CENTER_X}" y="${PERCENT_CENTER_Y}" font-family="${FONT_FAMILY}" font-size="${PERCENT_FONT_SIZE}" font-weight="700" fill="${hex}" text-anchor="middle" dominant-baseline="central">${displayValue}</text>
  <text x="${CENTER_X}" y="${CHANCE_CENTER_Y}" font-family="${FONT_FAMILY}" font-size="${CHANCE_FONT_SIZE}" font-weight="400" fill="${hex}" text-anchor="middle" dominant-baseline="central" letter-spacing="0.05em">CHANCE</text>
</svg>`;
}

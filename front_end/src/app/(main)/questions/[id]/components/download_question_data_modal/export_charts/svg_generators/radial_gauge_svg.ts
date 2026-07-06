import { METAC_COLORS } from "@/constants/colors";
import { getBinaryGaugeColors } from "@/utils/colors/binary_gauge_colors";

import { SVG_FONT_FAMILY, escapeXml } from "./svg_utils";

const SCALE = 288 / 112;
const WIDTH = 288;
const VERTICAL_OFFSET = 4;
const HEIGHT = Math.round((66 + VERTICAL_OFFSET + 4) * SCALE);

const STROKE_WIDTH = 12 * SCALE;
const RADIUS = ((112 - 12) / 2) * SCALE;
const CENTER_X = WIDTH / 2;
const CENTER_Y = (66 - 12 + VERTICAL_OFFSET) * SCALE;
const ARC_ANGLE = Math.PI * 1.1;

const PERCENT_CENTER_Y = (38 + VERTICAL_OFFSET) * SCALE;
const CHANCE_CENTER_Y = (60 + VERTICAL_OFFSET) * SCALE;
const PERCENT_FONT_SIZE = 24 * SCALE;
const CHANCE_FONT_SIZE = 12 * SCALE;
// Offset from geometric center to alphabetic baseline for visual centering,
// so rendering stays consistent in viewers that ignore dominant-baseline.
const BASELINE_CENTER_RATIO = 0.35;
const PERCENT_BASELINE_Y =
  PERCENT_CENTER_Y + PERCENT_FONT_SIZE * BASELINE_CENTER_RATIO;
const CHANCE_BASELINE_Y =
  CHANCE_CENTER_Y + CHANCE_FONT_SIZE * BASELINE_CENTER_RATIO;

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
  <text x="${CENTER_X}" y="${PERCENT_BASELINE_Y}" font-family="${SVG_FONT_FAMILY}" font-size="${PERCENT_FONT_SIZE}" font-weight="700" fill="${hex}" text-anchor="middle">${displayValue}</text>
  <text x="${CENTER_X}" y="${CHANCE_BASELINE_Y}" font-family="${SVG_FONT_FAMILY}" font-size="${CHANCE_FONT_SIZE}" font-weight="400" fill="${hex}" text-anchor="middle" letter-spacing="0.05em">CHANCE</text>
</svg>`;
}

const RESOLVED_CARD_MIN_WIDTH = 124;
const RESOLVED_CARD_HEIGHT = 82;
const RESOLVED_CARD_PADDING_X = 20;
const RESOLVED_CARD_PADDING_Y = 12;
const RESOLVED_CARD_RADIUS = 10;
const RESOLVED_CARD_BORDER_WIDTH = 1;
const RESOLVED_LABEL_FONT_SIZE = 16;
const RESOLVED_VALUE_FONT_SIZE = 24;
const RESOLVED_LABEL_LINE_HEIGHT = 24;
const RESOLVED_VALUE_LINE_HEIGHT = 32;
const RESOLVED_LABEL_CHAR_WIDTH = RESOLVED_LABEL_FONT_SIZE * 0.62;
const RESOLVED_VALUE_CHAR_WIDTH = RESOLVED_VALUE_FONT_SIZE * 0.62;

export function generateRadialGaugeResolvedSvg(
  formattedResolution: string,
  successfullyResolved: boolean,
  resolvedLabel: string
): string {
  const borderColor = successfullyResolved
    ? METAC_COLORS.purple["500"].DEFAULT
    : METAC_COLORS.gray["300"].DEFAULT;
  const labelColor = METAC_COLORS.purple["700"].DEFAULT;
  const valueColor = successfullyResolved
    ? METAC_COLORS.purple["800"].DEFAULT
    : METAC_COLORS.gray["700"].DEFAULT;

  const label = successfullyResolved ? resolvedLabel.toUpperCase() : "";
  const escapedLabel = escapeXml(label);
  const escapedValue = escapeXml(formattedResolution);

  const labelWidth = label.length * RESOLVED_LABEL_CHAR_WIDTH;
  const valueWidth = formattedResolution.length * RESOLVED_VALUE_CHAR_WIDTH;
  const contentWidth = Math.max(labelWidth, valueWidth);
  const cardWidth = Math.max(
    RESOLVED_CARD_MIN_WIDTH,
    Math.ceil(contentWidth + RESOLVED_CARD_PADDING_X * 2)
  );
  const cardHeight = RESOLVED_CARD_HEIGHT;

  const centerX = cardWidth / 2;
  const labelCenterY = RESOLVED_CARD_PADDING_Y + RESOLVED_LABEL_LINE_HEIGHT / 2;
  const valueCenterY = successfullyResolved
    ? RESOLVED_CARD_PADDING_Y +
      RESOLVED_LABEL_LINE_HEIGHT +
      RESOLVED_VALUE_LINE_HEIGHT / 2
    : cardHeight / 2;
  const labelBaselineY = labelCenterY + RESOLVED_LABEL_FONT_SIZE * 0.35;
  const valueBaselineY = valueCenterY + RESOLVED_VALUE_FONT_SIZE * 0.35;

  const halfBorder = RESOLVED_CARD_BORDER_WIDTH / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none">
  <rect x="${halfBorder}" y="${halfBorder}" width="${cardWidth - RESOLVED_CARD_BORDER_WIDTH}" height="${cardHeight - RESOLVED_CARD_BORDER_WIDTH}" rx="${RESOLVED_CARD_RADIUS}" ry="${RESOLVED_CARD_RADIUS}" fill="none" stroke="${borderColor}" stroke-width="${RESOLVED_CARD_BORDER_WIDTH}"/>
  ${successfullyResolved ? `<text x="${centerX}" y="${labelBaselineY}" font-family="${SVG_FONT_FAMILY}" font-size="${RESOLVED_LABEL_FONT_SIZE}" font-weight="400" fill="${labelColor}" text-anchor="middle">${escapedLabel}</text>` : ""}
  <text x="${centerX}" y="${valueBaselineY}" font-family="${SVG_FONT_FAMILY}" font-size="${RESOLVED_VALUE_FONT_SIZE}" font-weight="700" fill="${valueColor}" text-anchor="middle">${escapedValue}</text>
</svg>`;
}

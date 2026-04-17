import { SVG_FONT_FAMILY, escapeXml } from "./svg_utils";

const ROW_HEIGHT = 50;
const ROW_GAP = 14;
const SVG_WIDTH = 510;
const BORDER_RADIUS = 12;
const TEXT_PADDING_X = 18;
const FONT_SIZE = 25;
const LABEL_VALUE_GAP = 12;
const CHAR_WIDTH = FONT_SIZE * 0.52;

const OUTLINE_COLOR = "#C8CCCE";
const FILL_COLOR = "#91999E";
const TEXT_COLOR = "#2D2E2E";

type BarTableRow = {
  label: string;
  value: number;
  color: string;
};

function truncateToWidth(label: string, maxWidth: number): string {
  if (label.length * CHAR_WIDTH <= maxWidth) return label;
  const maxChars = Math.max(1, Math.floor(maxWidth / CHAR_WIDTH) - 1);
  return label.slice(0, maxChars) + "\u2026";
}

function renderRow(row: BarTableRow, index: number): string {
  const y = index * (ROW_HEIGHT + ROW_GAP);
  const barWidth = Math.max(0, (row.value / 100) * SVG_WIDTH);
  const displayValue = `${Math.round(row.value)}%`;
  const textY = y + ROW_HEIGHT / 2;
  const valueWidth = displayValue.length * CHAR_WIDTH;
  const maxLabelWidth =
    SVG_WIDTH - TEXT_PADDING_X * 2 - valueWidth - LABEL_VALUE_GAP;
  const labelText = truncateToWidth(row.label, maxLabelWidth);

  return `
    <g>
      <rect x="0.8" y="${y + 0.8}" width="${SVG_WIDTH - 1.6}" height="${ROW_HEIGHT - 1.6}" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="none" stroke="${OUTLINE_COLOR}" stroke-width="1.6"/>
      ${
        barWidth > 0
          ? `<rect x="0" y="${y}" width="${Math.min(barWidth, SVG_WIDTH)}" height="${ROW_HEIGHT}" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="${FILL_COLOR}" fill-opacity="0.3"/>
      <rect x="0.8" y="${y + 0.8}" width="${Math.min(barWidth, SVG_WIDTH) - 1.6}" height="${ROW_HEIGHT - 1.6}" rx="${BORDER_RADIUS}" ry="${BORDER_RADIUS}" fill="none" stroke="${FILL_COLOR}" stroke-opacity="0.5" stroke-width="1.6"/>`
          : ""
      }
      <text x="${TEXT_PADDING_X}" y="${textY}" font-family="${SVG_FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="400" fill="${TEXT_COLOR}" dominant-baseline="central">${escapeXml(labelText)}</text>
      <text x="${SVG_WIDTH - TEXT_PADDING_X}" y="${textY}" font-family="${SVG_FONT_FAMILY}" font-size="${FONT_SIZE}" font-weight="400" fill="${TEXT_COLOR}" dominant-baseline="central" text-anchor="end">${displayValue}</text>
    </g>`;
}

export function generateBarTableSvg(rows: BarTableRow[]): string {
  if (rows.length === 0) return "";

  const height = rows.length * ROW_HEIGHT + (rows.length - 1) * ROW_GAP;

  const rowsSvg = rows.map((row, i) => renderRow(row, i)).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${height}" viewBox="0 0 ${SVG_WIDTH} ${height}" fill="none">
${rowsSvg}
</svg>`;
}

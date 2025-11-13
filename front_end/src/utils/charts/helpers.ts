import { findLastIndex } from "lodash";

import { Line, TimelineChartZoomOption } from "@/types/charts";
import { QuestionLinearGraphType, QuestionType } from "@/types/question";

export const getChartZoomOptions = () =>
  Object.values(TimelineChartZoomOption).map((zoomOption) => ({
    label: zoomOption,
    value: zoomOption,
  }));

export const getClosestYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  if (i === -1) {
    return line[0]?.y ?? 0;
  }
  const p1 = line[i];
  const p2 = line[i + 1] ?? line[i];

  if (!p1?.y) return 0;
  if (!p2?.y) return p1.y;

  if (Math.abs(p2.x - xValue) > Math.abs(p1.x - xValue)) {
    return p1.y;
  }
  return p2.y;
};

export const interpolateYValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  if (i === -1) {
    return line[0]?.y ?? 0;
  }
  if (i === line.length - 1) {
    return line[line.length - 1]?.y ?? 0;
  }
  const p1 = line[i];
  const p2 = line[i + 1] ?? line[i];

  if (!p1?.y) return 0;
  if (!p2?.y) return p1.y;

  const t = (xValue - p1.x) / (p2.x - p1.x);
  return p1.y + t * (p2.y - p1.y);
};

export const getClosestXValue = (xValue: number, line: Line) => {
  const i = findLastIndex(line, (point) => point.x <= xValue);
  const p1 = line[i];
  const p2 = line[i + 1];
  if (!!p1 && !!p2) {
    if (Math.abs(p2.x - xValue) > Math.abs(p1.x - xValue)) {
      return p1.x;
    }
    return p2.x;
  }
  if (p1) return p1.x;
  if (p2) return p2.x;
  return 0;
};

const getPlaceholderElement = (text: string, fontSize: number) => {
  if (typeof document === "undefined") {
    return null;
  }

  const element = document.createElement("span");
  element.style.visibility = "hidden";
  element.style.position = "absolute";
  element.style.whiteSpace = "nowrap";
  element.style.fontSize = `${fontSize}px`;
  element.textContent = text;

  return element;
};

export function calculateTextWidth(fontSize: number, text: string): number {
  const element = getPlaceholderElement(text, fontSize);
  if (!element) {
    return 0;
  }

  document.body.appendChild(element);
  const textWidth = element.offsetWidth;
  document.body.removeChild(element);

  return textWidth;
}

export function calculateCharWidth(fontSize: number, text?: string): number {
  const sampleText =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const element = getPlaceholderElement(text ?? sampleText, fontSize);
  if (!element) {
    return 0;
  }

  document.body.appendChild(element);
  const charWidth = element.offsetWidth / sampleText.length;
  document.body.removeChild(element);

  return charWidth;
}

export function getLineGraphTypeFromQuestion(
  questionType: QuestionType
): QuestionLinearGraphType | null {
  let type: QuestionLinearGraphType | null;
  switch (questionType) {
    case QuestionType.Binary:
      type = "binary";
      break;
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      type = "continuous";
      break;
    default:
      type = null;
  }

  return type;
}

export function findLastIndexBefore(line: Line, timestamp: number): number {
  if (!line.length) return -1;

  let left = 0;
  let right = line.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const point = line[mid];
    if (!point) return -1;

    if (point.x <= timestamp) {
      if (
        mid === line.length - 1 ||
        (line[mid + 1]?.x ?? Infinity) > timestamp
      ) {
        return mid;
      }
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}

export function fitTrend(
  pts: Array<{ x: Date; y: number }>,
  yMeta: { lo: number; hi: number }
) {
  if (pts.length < 2) return null;

  const xs = pts.map((p) => +p.x);
  const ys = pts.map((p) => p.y);
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  const num = xs.reduce(
    (s, x, i) => s + (x - meanX) * ((ys[i] ?? 0) - meanY),
    0
  );
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0) || 1;
  const m = num / den;
  const b = meanY - m * meanX;

  const clampY = (v: number) =>
    Math.max(yMeta.lo - 0.5, Math.min(yMeta.hi + 0.5, v));

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  return [
    { x: new Date(minX), y: clampY(m * minX + b) },
    { x: new Date(maxX), y: clampY(m * maxX + b) },
  ];
}

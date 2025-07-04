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

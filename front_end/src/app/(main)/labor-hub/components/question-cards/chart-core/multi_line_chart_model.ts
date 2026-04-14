import {
  type MultiLineChartPoint,
  type MultiLineChartSeries,
  type MultiLineChartYAxisLabel,
} from "../../question_cards/multi_line_chart.types";

const CUSTOM_Y_TICK_MAX_CHARS = 10;
const LABEL_BOUND_TOP_INSET_RATIO = 0.06;
const GRID_TICK_NEAR_LABEL_RATIO = 0.05;
export const LABEL_Y_VALUE_EPS = 1e-6;
const TEXT_LABEL_GUTTER_AVG_CHAR_PX = 6.5;
const TEXT_LABEL_GUTTER_LEADING_PX = 12;
const TEXT_LABEL_GUTTER_MIN_PX = 60;
const TEXT_LABEL_GUTTER_MAX_PX = 118;

export const CHART_PADDING = { top: 20, bottom: 40, right: 0 } as const;

const wrapText = (text: string, maxCharsPerLine: number): string[] => {
  if (text.length <= maxCharsPerLine) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

function estimateTextLabelYAxisGutter(
  labels: MultiLineChartYAxisLabel[]
): number {
  const maxLineChars = Math.max(
    1,
    ...labels.flatMap((label) =>
      wrapText(label.text, CUSTOM_Y_TICK_MAX_CHARS).map((line) => line.length)
    )
  );
  const labelBlockWidth =
    Math.ceil(maxLineChars * TEXT_LABEL_GUTTER_AVG_CHAR_PX) +
    TEXT_LABEL_GUTTER_LEADING_PX;

  return Math.min(
    TEXT_LABEL_GUTTER_MAX_PX,
    Math.max(TEXT_LABEL_GUTTER_MIN_PX, labelBlockWidth)
  );
}

function estimateNumericYAxisGutter(
  tickValues: number[],
  formatYTick: (value: number) => string
): number {
  if (!tickValues.length) return 44;
  const maxLen = Math.max(
    ...tickValues.map((tick) => formatYTick(tick).length)
  );
  return Math.min(76, Math.max(36, 12 + maxLen * 8));
}

export function closestTickValue(
  value: number,
  ticks: number[]
): number | null {
  if (!ticks.length) return null;
  return ticks.reduce((best, tick) =>
    Math.abs(tick - value) < Math.abs(best - value) ? tick : best
  );
}

type ComputeMultiLineChartModelArgs = {
  series: MultiLineChartSeries[];
  yAxisLabels?: MultiLineChartYAxisLabel[];
  showTickLabels: boolean;
  formatYTick: (value: number) => string;
  yAxisGutter?: number;
  xTickValues?: number[];
};

export function computeMultiLineChartModel({
  series,
  yAxisLabels,
  showTickLabels,
  formatYTick,
  yAxisGutter,
  xTickValues: xTickValuesProp,
}: ComputeMultiLineChartModelArgs) {
  const derivedXTickValues = Array.from(
    new Set(
      series.flatMap((s) => s.data.map((point: MultiLineChartPoint) => point.x))
    )
  ).sort((a, b) => a - b);
  const xTickValues = (
    xTickValuesProp?.length ? xTickValuesProp : derivedXTickValues
  )
    .slice()
    .sort((a, b) => a - b);
  const xValues = xTickValues.length
    ? xTickValues
    : series.flatMap((s) =>
        s.data.map((point: MultiLineChartPoint) => point.x)
      );
  const dataValues = series.flatMap((s) =>
    s.data.map((point: MultiLineChartPoint) => point.y)
  );

  const hasDataLabels = series.some((s) => s.dataLabels !== "never");

  let xDomain: [number, number];
  if (!xValues.length) {
    xDomain = [0, 1];
  } else {
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const xPadding = minX === maxX ? 1 : (maxX - minX) * 0.1;
    xDomain = [minX - xPadding, maxX + xPadding];
  }

  let yMin: number;
  let yMax: number;

  if (yAxisLabels?.length) {
    const labelMin = Math.min(...yAxisLabels.map((label) => label.value));
    const labelMax = Math.max(...yAxisLabels.map((label) => label.value));
    const labelSpan = labelMax - labelMin || 1;
    const topLabelInset = Math.max(1, labelSpan * LABEL_BOUND_TOP_INSET_RATIO);

    if (!dataValues.length) {
      yMin = labelMin;
      yMax =
        (labelMax === labelMin ? labelMin + labelSpan : labelMax) +
        topLabelInset;
    } else {
      const dataMin = Math.min(...dataValues);
      const dataMax = Math.max(...dataValues);
      const dataInsideLabels = dataMin >= labelMin && dataMax <= labelMax;

      if (dataInsideLabels) {
        yMin = labelMin;
        yMax = labelMax + topLabelInset;
      } else {
        const minValue = Math.min(dataMin, labelMin);
        const maxValue = Math.max(dataMax, labelMax);
        const range = maxValue - minValue || 1;
        const bottomPadding = range * (hasDataLabels ? 0.3 : 0.15);
        const topPadding = range * 0.15;
        yMin = minValue - bottomPadding;
        yMax = maxValue + topPadding;
      }
    }
  } else if (!dataValues.length) {
    yMin = 0;
    yMax = 1;
  } else {
    const minValue = Math.min(...dataValues);
    const maxValue = Math.max(...dataValues);
    const range = maxValue - minValue || 1;
    const bottomPadding = range * (hasDataLabels ? 0.3 : 0.15);
    const topPadding = range * 0.15;
    yMin = minValue - bottomPadding;
    yMax = maxValue + topPadding;
  }

  const yDomain: [number, number] = [yMin, yMax];
  const range = yMax - yMin;
  const rawStep = range / 5 || 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const candidates = [1, 2, 5, 10, 25, 50].map(
    (multiplier) => multiplier * magnitude
  );
  const step =
    candidates.find(
      (candidate) => range / candidate <= 8 && range / candidate >= 3
    ) ??
    candidates[candidates.length - 1] ??
    1;

  const yTickValues: number[] = [];
  const startTick = Math.floor(yMin / step) * step;
  const endTick = Math.ceil(yMax / step) * step;
  for (let tick = startTick; tick <= endTick; tick += step) {
    yTickValues.push(Math.round(tick * 1000) / 1000);
  }

  const labelTickValues = yAxisLabels?.length
    ? [...new Set(yAxisLabels.map((label) => label.value))].sort(
        (a, b) => a - b
      )
    : [];

  const gridYTickValues =
    yAxisLabels?.length && labelTickValues.length
      ? (() => {
          const minSep = Math.max(
            Math.abs(yMax - yMin) * GRID_TICK_NEAR_LABEL_RATIO,
            1e-6
          );
          const autoTicksNotNearLabels = yTickValues.filter(
            (tick) =>
              !labelTickValues.some(
                (labelValue) => Math.abs(tick - labelValue) <= minSep
              )
          );

          return [
            ...new Set([...labelTickValues, ...autoTicksNotNearLabels]),
          ].sort((a, b) => a - b);
        })()
      : yTickValues;

  const leftPadding =
    yAxisGutter ??
    (yAxisLabels?.length
      ? estimateTextLabelYAxisGutter(yAxisLabels)
      : showTickLabels
        ? estimateNumericYAxisGutter(gridYTickValues, formatYTick)
        : 0);

  const labelTextByValue = new Map(
    yAxisLabels?.map((label) => [label.value, label.text]) ?? []
  );

  const labelTickFormat = (tick: number) => labelTextByValue.get(tick) ?? "";
  const gridAxisTickFormat = (tick: string | number) => {
    if (!showTickLabels) return "";

    const numericTick = typeof tick === "number" ? tick : Number(tick);
    const isCustomLabelAnchor = labelTickValues.some(
      (labelValue) => Math.abs(numericTick - labelValue) <= LABEL_Y_VALUE_EPS
    );

    if (labelTickValues.length && isCustomLabelAnchor) {
      return "";
    }

    return formatYTick(numericTick);
  };

  return {
    xDomain,
    yDomain,
    xTickValues,
    yTickValues,
    labelTickValues,
    gridYTickValues,
    leftPadding,
    labelTickFormat,
    gridAxisTickFormat,
    customYAxisTickMaxChars: CUSTOM_Y_TICK_MAX_CHARS,
  };
}

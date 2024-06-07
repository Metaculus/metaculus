import * as d3 from "d3";
import { Tuple } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import { Scale } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { MultipleChoiceForecast } from "@/types/question";

export function generateNumericDomain(values: number[]): Tuple<number> {
  const min = Math.min(...values);
  const max = Math.max(...values);

  return [min, max];
}

export function generateTimestampXScale(
  xDomain: Tuple<number>,
  width: number
): Scale {
  const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;

  let ticks;
  let format;
  const timeRange = xDomain[1] - xDomain[0];
  const maxTicks = Math.floor(width / 80);
  if (timeRange < threeMonths) {
    ticks = d3.timeDay.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %d");
  } else if (timeRange < twoYears) {
    ticks = d3.timeMonth.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %Y");
  } else {
    ticks = d3.timeYear.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%Y");
  }

  return {
    ticks: ticks.map((tick) => tick.getTime()),
    tickFormat: (x: number, index?: number) => {
      if (!index) {
        return format(new Date(x));
      }

      if (index % Math.max(1, Math.floor(ticks.length / maxTicks)) !== 0) {
        return "";
      }

      if (ticks && index >= ticks.length - 2) {
        return "";
      }

      return format(new Date(x));
    },
  };
}

export function generateNumericYScale(yDomain: Tuple<number>): Scale {
  const [min, max] = yDomain;
  const range = max - min;

  const majorStep = range / 4;
  const minorStep = majorStep / 5;

  const majorTicks = new Set<number>();
  for (let i = min; i <= max; i += majorStep) {
    majorTicks.add(Math.round(i));
  }

  const minorTicks = new Set<number>();
  for (let i = min; i <= max; i += minorStep) {
    if (!majorTicks.has(Math.round(i))) {
      minorTicks.add(Math.round(i));
    }
  }

  const ticks = [...Array.from(majorTicks), ...Array.from(minorTicks)].sort(
    (a, b) => a - b
  );

  return { ticks, tickFormat: (y) => (majorTicks.has(y) ? y.toString() : "") };
}

export function generatePercentageYScale(containerHeight: number): Scale {
  const desiredMajorTicks = [0, 20, 40, 60, 80, 100].map((tick) => tick / 100);
  const minorTicksPerMajor = 9;
  const desiredMajorTickDistance = 20;

  const maxMajorTicks = Math.floor(containerHeight / desiredMajorTickDistance);

  let majorTicks = desiredMajorTicks;
  if (maxMajorTicks < desiredMajorTicks.length) {
    // adjust major ticks on small height
    const step = 1 / (maxMajorTicks - 1);
    majorTicks = Array.from({ length: maxMajorTicks }, (_, i) => i * step);
  }

  const ticks = [];
  for (let i = 0; i < majorTicks.length - 1; i++) {
    ticks.push(majorTicks[i]);
    const step = (majorTicks[i + 1] - majorTicks[i]) / (minorTicksPerMajor + 1);
    for (let j = 1; j <= minorTicksPerMajor; j++) {
      ticks.push(majorTicks[i] + step * j);
    }
  }
  ticks.push(majorTicks[majorTicks.length - 1]);

  return {
    ticks,
    tickFormat: (y: number) =>
      majorTicks.includes(y) ? `${Math.round(y * 100)}%` : "",
  };
}

const COLOR_SCALE = Object.values(METAC_COLORS["mc-option"]).map(
  (value) => value
);
export function generateChartChoices(
  dataset: MultipleChoiceForecast
): ChoiceItem[] {
  const { timestamps, nr_forecasters, ...choices } = dataset;
  return Object.entries(choices).map(([choice, values], index) => ({
    choice,
    values: values.map((x: { value_mean: number }) => x.value_mean),
    color: COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
    active: true,
    highlighted: false,
  }));
}

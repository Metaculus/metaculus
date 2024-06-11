import * as d3 from "d3";
import { Tuple } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import { NumericChartType, Scale } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { MultipleChoiceForecast, QuestionType } from "@/types/question";

export function getNumericChartTypeFromQuestion(
  type: QuestionType
): NumericChartType | undefined {
  switch (type) {
    case QuestionType.Numeric:
      return "numeric";
    case QuestionType.Date:
      return "date";
    case QuestionType.Binary:
      return "binary";
    default:
      return undefined;
  }
}

export function generateNumericDomain(values: number[]): Tuple<number> {
  const min = Math.min(...values);
  const max = Math.max(...values);

  return [min, max];
}

export function generateTimestampXScale(
  xDomain: Tuple<number>,
  width: number
): Scale {
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  const oneDay = 24 * oneHour;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;
  const oneYear = 365 * oneDay;

  let ticks;
  let format;
  const timeRange = xDomain[1] - xDomain[0];
  const maxTicks = Math.floor(width / 80);
  if (timeRange < oneHour) {
    ticks = d3.timeMinute.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%H:%M");
  } else if (timeRange < oneDay) {
    const every30Minutes = d3.timeMinute.every(30);
    if (every30Minutes) {
      ticks = every30Minutes.range(new Date(xDomain[0]), new Date(xDomain[1]));
    } else {
      ticks = d3.timeHour.range(new Date(xDomain[0]), new Date(xDomain[1]));
    }
    format = d3.timeFormat("%H:%M");
  } else if (timeRange < oneWeek) {
    ticks = d3.timeDay.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %d");
  } else if (timeRange < oneMonth) {
    ticks = d3.timeWeek.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %d");
  } else if (timeRange < oneYear) {
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

export function generateDateYScale(yDomain: Tuple<number>): Scale {
  const totalTicks = 20;
  const majorTickStep = 5;

  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  const range = yDomain[1] - yDomain[0];

  let format;
  if (range < oneDay) {
    format = d3.timeFormat("%H:%M");
  } else {
    format = d3.timeFormat("%b %d");
  }

  const timeScale = d3.scaleTime().domain(yDomain).nice(totalTicks);
  const ticks = timeScale.ticks(totalTicks);

  const majorTicks = new Set<number>();
  const minorTicks = new Set<number>();
  ticks.forEach((tick, index) => {
    if (index % majorTickStep === 0) {
      majorTicks.add(tick.getTime());
    } else {
      minorTicks.add(tick.getTime());
    }
  });

  return {
    ticks: ticks.map((tick) => tick.getTime()),
    tickFormat: (y: number) => {
      if (majorTicks.has(y)) {
        return format(new Date(y));
      } else {
        return "";
      }
    },
  };
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

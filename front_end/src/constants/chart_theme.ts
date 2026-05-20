import { merge } from "lodash";
import { VictoryTheme, VictoryThemeDefinition } from "victory";

import {
  CHART_FONT_FAMILY,
  CHART_FONT_SIZE,
} from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";

type TickSizeFn = (args: { text?: string }) => number;
const dynamicTickSize: TickSizeFn = ({ text }) => (text === "" ? 3 : 5);

export const baseChartTheme: VictoryThemeDefinition = {
  chart: {
    padding: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 50,
    },
  },
  line: {
    style: {
      data: {
        strokeWidth: 1,
      },
    },
  },
  axis: {
    style: {
      ticks: {
        size: dynamicTickSize as unknown as number,
      },
      tickLabels: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: CHART_FONT_SIZE.tick,
        fontVariantNumeric: "tabular-nums",
        padding: 0,
      },
      axisLabel: {
        fontFamily: CHART_FONT_FAMILY,
        fontSize: CHART_FONT_SIZE.axisLabel,
        fontVariantNumeric: "tabular-nums",
      },
    },
  },
};

const lightChart: VictoryThemeDefinition = {
  axis: {
    style: {
      ticks: {
        stroke: "black",
      },
      axis: {
        stroke: "black",
      },
      tickLabels: {
        fill: "black",
      },
      axisLabel: {
        fill: "black",
      },
    },
  },
  line: {
    style: {
      data: {
        stroke: METAC_COLORS.olive["700"].DEFAULT,
      },
    },
  },
  area: {
    style: {
      data: {
        fill: METAC_COLORS.olive["500"].DEFAULT,
      },
    },
  },
};

const darkChart: VictoryThemeDefinition = {
  axis: {
    style: {
      ticks: {
        stroke: "white",
      },
      axis: {
        stroke: "white",
      },
      tickLabels: {
        fill: "white",
      },
      axisLabel: {
        fill: "white",
      },
    },
  },
  line: {
    style: {
      data: {
        stroke: METAC_COLORS.olive["700"].dark,
      },
    },
  },
  area: {
    style: {
      data: {
        fill: METAC_COLORS.olive["500"].dark,
      },
    },
  },
};

export const lightTheme = merge(
  {},
  VictoryTheme.grayscale,
  baseChartTheme,
  lightChart
);
export const darkTheme = merge(
  {},
  VictoryTheme.grayscale,
  baseChartTheme,
  darkChart
);

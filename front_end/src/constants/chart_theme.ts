import { merge } from "lodash";
import { VictoryTheme, VictoryThemeDefinition } from "victory";

import { METAC_COLORS } from "@/constants/colors";

const sansSerif = "var(--font-inter-variable) var(--font-inter)";

const baseChart: VictoryThemeDefinition = {
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
        size: (({ text }: { text: string }) => (text === "" ? 3 : 5)) as any,
      },
      tickLabels: { fontFamily: sansSerif, fontSize: 9, padding: 0 },
      axisLabel: { fontFamily: sansSerif, fontSize: 9 },
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
  baseChart,
  lightChart
);
export const darkTheme = merge(
  {},
  VictoryTheme.grayscale,
  baseChart,
  darkChart
);

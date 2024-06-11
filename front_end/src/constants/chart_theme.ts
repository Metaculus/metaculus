import { merge } from "lodash";
import { VictoryTheme, VictoryThemeDefinition } from "victory";

const sansSerif = "var(--font-diatype-variable) var(--font-diatype)";

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

import { merge } from "lodash";
import { VictoryTheme, VictoryThemeDefinition } from "victory";

const sansSerif = "var(--font-diatype-variable) var(--font-diatype)";

const customChartTheme: VictoryThemeDefinition = {
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
        stroke: "black",
        size: (({ text }: { text: string }) => (text === "" ? 3 : 5)) as any,
      },
      tickLabels: { fontFamily: sansSerif, fontSize: 9, padding: 0 },
      axisLabel: { fontFamily: sansSerif, fontSize: 9 },
    },
  },
};

const chartTheme = merge(VictoryTheme.grayscale, customChartTheme);

export default chartTheme;

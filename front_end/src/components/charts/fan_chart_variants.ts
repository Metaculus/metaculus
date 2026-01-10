import { ComponentProps } from "react";
import { VictoryAxis } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import { ThemeColor } from "@/types/theme";

export type FanChartVariant = "default" | "index";

export type VariantArgs = {
  chartWidth: number;
  yLabel?: string;
  tickLabelFontSize: number;
  maxLeftPadding: number;
  maxRightPadding: number;
  isEmbedded?: boolean;
  getThemeColor: (c: ThemeColor) => string;
};

type ResolutionPointStyle = {
  size: number;
  strokeWidth: number;
  fill: (args: Pick<VariantArgs, "getThemeColor">) => string;
};

type AxisStyle = NonNullable<ComponentProps<typeof VictoryAxis>["style"]>;

export type VariantConfig = {
  id: FanChartVariant;
  yAxisStyle: (
    args: Omit<VariantArgs, "chartWidth" | "yLabel">
  ) => AxisStyle | undefined;
  xAxisStyle: (
    args: Omit<VariantArgs, "chartWidth" | "yLabel">
  ) => AxisStyle | undefined;
  domainPadding: (args: VariantArgs) => {
    x: [number, number];
    y?: [number, number];
  };
  padding: (args: VariantArgs) => {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  axisLabelOffsetX: (args: VariantArgs) => number;
  forceTickCount?: number;
  palette: (args: Pick<VariantArgs, "getThemeColor">) => {
    communityArea: string;
    communityLine: string;
    userArea: string;
    userLine: string;
    resolutionStroke: string;
    communityPoint: string;
  };
  resolutionPoint: ResolutionPointStyle;
};

export const fanVariants: Record<FanChartVariant, VariantConfig> = {
  default: {
    id: "default",
    yAxisStyle: ({ getThemeColor, tickLabelFontSize }) => ({
      ticks: { stroke: "transparent" },
      axisLabel: {
        fontFamily: "Inter",
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      tickLabels: {
        fontFamily: "Inter",
        padding: 5,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      axis: { stroke: "transparent" },
      grid: {
        stroke: getThemeColor(METAC_COLORS.gray["400"]),
        strokeWidth: 1,
        strokeDasharray: "2, 5",
      },
    }),
    xAxisStyle: () => ({
      ticks: { stroke: "transparent" },
      axis: { stroke: "transparent" },
    }),
    domainPadding: () => ({ x: [150 / 2, 150 / 2] }),
    padding: ({ maxLeftPadding }) => ({
      left: maxLeftPadding,
      top: 10,
      right: 10,
      bottom: 20,
    }),
    axisLabelOffsetX: ({ maxLeftPadding }) => Math.max(maxLeftPadding - 2, 8),
    palette: ({ getThemeColor }) => ({
      communityArea: getThemeColor(METAC_COLORS.olive["500"]),
      communityLine: getThemeColor(METAC_COLORS.olive["800"]),
      userArea: getThemeColor(METAC_COLORS.orange["500"]),
      userLine: getThemeColor(METAC_COLORS.orange["700"]),
      resolutionStroke: getThemeColor(METAC_COLORS.purple["800"]),
      communityPoint: getThemeColor(METAC_COLORS.olive["800"]),
    }),
    resolutionPoint: {
      size: 10,
      strokeWidth: 2.5,
      fill: () => "none",
    },
  },
  index: {
    id: "index",
    yAxisStyle: ({ tickLabelFontSize, getThemeColor }) => ({
      ticks: { stroke: "transparent" },
      axisLabel: {
        fontFamily: "Inter",
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      tickLabels: {
        fontFamily: "Inter",
        padding: 5,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      axis: { stroke: "transparent" },
      grid: {
        stroke: getThemeColor(METAC_COLORS.gray["400"]),
        strokeWidth: 1,
        strokeDasharray: "2, 5",
      },
    }),
    xAxisStyle: ({ tickLabelFontSize, getThemeColor }) => ({
      ticks: { stroke: "transparent" },
      axis: { stroke: "transparent" },
      tickLabels: {
        fontFamily: "Inter",
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
    }),
    domainPadding: () => ({ x: [20, 20], y: [12, 0] }),
    padding: ({ maxRightPadding }) => ({
      left: 10,
      top: 10,
      right: maxRightPadding - 10,
      bottom: 15,
    }),
    axisLabelOffsetX: ({ chartWidth, yLabel, tickLabelFontSize }) =>
      !yLabel ? chartWidth + 5 : chartWidth - tickLabelFontSize + 5,
    forceTickCount: 5,
    palette: ({ getThemeColor }) => ({
      communityArea: getThemeColor(METAC_COLORS.blue["500"]),
      communityLine: getThemeColor(METAC_COLORS.blue["700"]),
      userArea: getThemeColor(METAC_COLORS.orange["500"]),
      userLine: getThemeColor(METAC_COLORS.orange["700"]),
      resolutionStroke: getThemeColor(METAC_COLORS.purple["800"]),
      communityPoint: getThemeColor(METAC_COLORS.blue["700"]),
    }),
    resolutionPoint: {
      size: 13,
      strokeWidth: 3,
      fill: ({ getThemeColor }) => getThemeColor(METAC_COLORS.purple["800"]),
    },
  },
};

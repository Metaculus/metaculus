import { ComponentProps } from "react";
import { VictoryAxis } from "victory";

import { CHART_DASH } from "@/constants/chart_dash";
import { CHART_POINT_SIZE, CHART_STROKE_WIDTH } from "@/constants/chart_stroke";
import { CHART_FONT_STYLE } from "@/constants/chart_typography";
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
  forFeedPage?: boolean;
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
  palette: (args: Pick<VariantArgs, "getThemeColor" | "isEmbedded">) => {
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
        ...CHART_FONT_STYLE.axisLabel,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      tickLabels: {
        ...CHART_FONT_STYLE.tick,
        padding: 5,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      axis: { stroke: "transparent" },
      grid: {
        stroke: getThemeColor(METAC_COLORS.gray["400"]),
        strokeWidth: CHART_STROKE_WIDTH.grid,
        strokeDasharray: CHART_DASH.grid,
      },
    }),
    xAxisStyle: ({ tickLabelFontSize, getThemeColor }) => ({
      ticks: { stroke: "transparent" },
      axis: { stroke: "transparent" },
      tickLabels: {
        ...CHART_FONT_STYLE.tick,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
    }),
    domainPadding: ({ isEmbedded, forFeedPage }) =>
      isEmbedded || forFeedPage ? { x: [16, 16] } : { x: [150 / 2, 150 / 2] },
    padding: ({ maxRightPadding }) => ({
      left: 10,
      top: 10,
      right: maxRightPadding,
      bottom: 20,
    }),
    axisLabelOffsetX: () => 0,
    palette: ({ getThemeColor, isEmbedded }) => ({
      communityArea: getThemeColor(METAC_COLORS.olive["500"]),
      communityLine: getThemeColor(METAC_COLORS.olive["800"]),
      userArea: getThemeColor(METAC_COLORS.orange["500"]),
      userLine: getThemeColor(METAC_COLORS.orange["700"]),
      resolutionStroke: getThemeColor(METAC_COLORS.purple["800"]),
      communityPoint: isEmbedded
        ? getThemeColor(METAC_COLORS.olive["700"])
        : getThemeColor(METAC_COLORS.olive["800"]),
    }),
    resolutionPoint: {
      size: CHART_POINT_SIZE.resolutionDiamond,
      strokeWidth: CHART_STROKE_WIDTH.resolutionDiamond,
      fill: () => "none",
    },
  },
  index: {
    id: "index",
    yAxisStyle: ({ tickLabelFontSize, getThemeColor }) => ({
      ticks: { stroke: "transparent" },
      axisLabel: {
        ...CHART_FONT_STYLE.axisLabel,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      tickLabels: {
        ...CHART_FONT_STYLE.tick,
        padding: 5,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
      axis: { stroke: "transparent" },
      grid: {
        stroke: getThemeColor(METAC_COLORS.gray["400"]),
        strokeWidth: CHART_STROKE_WIDTH.grid,
        strokeDasharray: CHART_DASH.grid,
      },
    }),
    xAxisStyle: ({ tickLabelFontSize, getThemeColor }) => ({
      ticks: { stroke: "transparent" },
      axis: { stroke: "transparent" },
      tickLabels: {
        ...CHART_FONT_STYLE.tick,
        fontSize: tickLabelFontSize,
        fill: getThemeColor(METAC_COLORS.gray["600"]),
      },
    }),
    domainPadding: () => ({ x: [20, 20], y: [12, 0] }),
    padding: ({ maxRightPadding }) => ({
      left: 10,
      top: 10,
      right: maxRightPadding,
      bottom: 15,
    }),
    axisLabelOffsetX: () => 0,
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
      size: CHART_POINT_SIZE.resolutionDiamond,
      strokeWidth: CHART_STROKE_WIDTH.resolutionDiamond,
      fill: ({ getThemeColor }) => getThemeColor(METAC_COLORS.purple["800"]),
    },
  },
};

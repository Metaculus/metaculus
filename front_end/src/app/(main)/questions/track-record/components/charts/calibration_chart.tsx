"use client";

import React from "react";
import {
  VictoryChart,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import { TrackRecordCalibrationCurveItem } from "@/types/track_record";
import { METAC_COLORS } from "@/constants/colors";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const CalibrationChart: React.FC<{
  calibrationData: TrackRecordCalibrationCurveItem[];
  showIntervals?: boolean;
  username?: string;
}> = ({ calibrationData, showIntervals = true, username }) => {
  const t = useTranslations();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  console.log(calibrationData);
  return (
    <div className="mb-5 size-full">
      <VictoryChart
        theme={chartTheme}
        domain={{ x: [0, 1], y: [0, 1] }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 24, bottom: 45, left: 45, right: 12 }}
      >
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          style={{
            tickLabels: { fontSize: 10, fontWeight: 200 },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: {
              stroke: chartTheme.axis?.style?.axis?.stroke,
              opacity: 0.5,
            },
          }}
          label={
            username ? t("userPrediction", { username }) : t("predictions")
          }
        />
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          dependentAxis
          axisLabelComponent={<VictoryLabel dy={-12} />}
          style={{
            tickLabels: { fontSize: 10, fontWeight: 200 },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: {
              stroke: chartTheme.axis?.style?.axis?.stroke,
              opacity: 0.5,
            },
          }}
          label={t("fractionResolvedYes")}
        />
        <VictoryScatter
          data={calibrationData.map(
            (d: TrackRecordCalibrationCurveItem, index: number) => {
              const y = d.middle_quartile;
              return {
                x: (d.bin_lower + d.bin_upper) / 2,
                y0: y - 0.01,
                y: y,
                symbol: "diamond",
              };
            }
          )}
          style={{
            data: {
              fill: getThemeColor(METAC_COLORS.gold["500"]),
              stroke: "none",
            },
          }}
        />
        <VictoryBar
          data={calibrationData.map(
            (d: TrackRecordCalibrationCurveItem, index: number) => {
              const y = d.perfect_calibration;
              return {
                x: (d.bin_lower + d.bin_upper) / 2,
                y0: y - 0.005,
                y: y + 0.005,
                binWidth: d.bin_upper - d.bin_lower, // Add binWidth to each data point
              };
            }
          )}
          barWidth={({ datum }) => datum.binWidth * 400} // Use binWidth to set bar width
          style={{
            data: {
              fill: getThemeColor(METAC_COLORS.gray["600"]),
              opacity: 1,
            },
          }}
        />
        {/* Confidence interval area */}
        {showIntervals && (
          <VictoryBar
            data={calibrationData.map(
              (d: TrackRecordCalibrationCurveItem, index: number) => {
                return {
                  x: (d.bin_lower + d.bin_upper) / 2,
                  y0: d.lower_quartile,
                  y: d.upper_quartile,
                  binWidth: d.bin_upper - d.bin_lower, // Add binWidth to each data point
                };
              }
            )}
            barWidth={({ datum }) => datum.binWidth * 400} // Use binWidth to set bar width
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.gray["300"]),
                opacity: 0.5,
              },
            }}
          />
        )}
      </VictoryChart>
    </div>
  );
};

export default dynamic(() => Promise.resolve(CalibrationChart), {
  ssr: false,
});

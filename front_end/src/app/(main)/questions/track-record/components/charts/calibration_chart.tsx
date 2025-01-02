"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryChart,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
} from "victory";

import SectionToggle from "@/components/ui/section_toggle";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { TrackRecordCalibrationCurveItem } from "@/types/track_record";

const CalibrationChart: React.FC<{
  calibrationData: TrackRecordCalibrationCurveItem[];
  showIntervals?: boolean;
  username?: string;
}> = ({ calibrationData, showIntervals = true, username }) => {
  const t = useTranslations();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  return (
    <div className="mb-5 size-full">
      <div>
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
            data={calibrationData.map((d: TrackRecordCalibrationCurveItem) => {
              const y = d.average_resolution;
              return {
                x: (d.bin_lower + d.bin_upper) / 2,
                y0: y - 0.01,
                y: y,
                symbol: "diamond",
              };
            })}
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.gold["500"]),
                stroke: "none",
              },
            }}
          />
          <VictoryBar
            data={calibrationData.map((d: TrackRecordCalibrationCurveItem) => {
              const y = d.perfect_calibration;
              return {
                x: (d.bin_lower + d.bin_upper) / 2,
                y0: y - 0.005,
                y: y + 0.005,
                binWidth: d.bin_upper - d.bin_lower,
              };
            })}
            barWidth={({ datum }) => datum.binWidth * 400}
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
                (d: TrackRecordCalibrationCurveItem) => {
                  return {
                    x: (d.bin_lower + d.bin_upper) / 2,
                    y0: d.lower_confidence_interval,
                    y: d.upper_confidence_interval,
                    binWidth: d.bin_upper - d.bin_lower,
                  };
                }
              )}
              barWidth={({ datum }) => datum.binWidth * 400}
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
      <div className="flex flex-col items-center space-y-3 divide-y divide-gray-300 dark:divide-gray-700">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 md:gap-x-8">
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span
              className="block h-4 w-7"
              style={{
                backgroundColor: getThemeColor(METAC_COLORS.gray["300"]),
              }}
            ></span>
            {t("perfectCalibration90CI")}
          </div>
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span
              className="block h-1 w-7"
              style={{
                backgroundColor: getThemeColor(METAC_COLORS.gray["600"]),
              }}
            ></span>
            {t("perfectCalibration")}
          </div>
          <div className="flex flex-row items-center gap-3 text-sm text-gray-800 dark:text-gray-200">
            <span
              className="block size-2 rotate-45"
              style={{
                backgroundColor: getThemeColor(METAC_COLORS.gold["500"]),
              }}
            ></span>
            {username
              ? t("userCalibration", { username: username })
              : t("communityPredictionCalibration")}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <SectionToggle title="Details" defaultOpen={false}>
          <span className="pt-3 text-sm text-gray-600 dark:text-gray-400">
            {t("calibrationCurveInfoMain")}
            <br />
            <br />
            {t("calibrationCurveInfo")}
          </span>
        </SectionToggle>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(CalibrationChart), {
  ssr: false,
});

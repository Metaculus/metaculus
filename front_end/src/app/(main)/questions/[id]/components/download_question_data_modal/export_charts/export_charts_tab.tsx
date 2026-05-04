"use client";

import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import {
  CHART_TYPE_TRANSLATION_KEYS,
  ExportableChartType,
  getExportableConfig,
} from "./config/chart_exportables";
import OffscreenChartRenderer from "./renderer/offscreen_chart_renderer";
import { useChartExport } from "./use_chart_export";

type Props = {
  post: PostWithForecasts;
};

const ExportChartsTab: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const [selectedCharts, setSelectedCharts] = useState<
    Set<ExportableChartType>
  >(new Set());

  const { chartTypes } = getExportableConfig(post);

  const {
    exportCharts,
    isExporting,
    currentRender,
    handleRendered,
    handleError,
  } = useChartExport(post);

  const toggleChart = useCallback((type: ExportableChartType) => {
    setSelectedCharts((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleExport = () => {
    const types = chartTypes.filter((type) => selectedCharts.has(type));
    if (types.length > 0) {
      exportCharts(types);
    }
  };

  const selectedCount = chartTypes.filter((type) =>
    selectedCharts.has(type)
  ).length;

  const buttonText = isExporting
    ? t("preparingExport")
    : selectedCount > 1
      ? t("downloadAll")
      : t("downloadExport");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-sm font-bold text-gray-900 dark:text-gray-900-dark">
          {t("availableCharts")}
        </h3>

        <div className="flex flex-col gap-1.5">
          {chartTypes.map((type) => {
            const isSelected = selectedCharts.has(type);
            return (
              <div
                key={type}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 transition-colors",
                  isSelected
                    ? "border-blue-500 bg-blue-100 dark:border-blue-500-dark dark:bg-blue-100-dark"
                    : "border-gray-300 bg-gray-0 hover:border-gray-400 dark:border-gray-300-dark dark:bg-gray-0-dark dark:hover:border-gray-400-dark",
                  isExporting && "pointer-events-none opacity-60"
                )}
                onClick={() => !isExporting && toggleChart(type)}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleChart(type)}
                  label={t(
                    CHART_TYPE_TRANSLATION_KEYS[type] as Parameters<typeof t>[0]
                  )}
                  disabled={isExporting}
                  className="pointer-events-none"
                />
              </div>
            );
          })}
        </div>

        {chartTypes.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-300-dark">
            <FontAwesomeIcon
              icon={faChartBar}
              className="text-xl text-gray-400 dark:text-gray-400-dark"
            />
            <p className="m-0 text-sm text-gray-600 dark:text-gray-600-dark">
              {t("noForecastDataForExport")}
            </p>
          </div>
        )}
      </div>

      <Button
        className="w-full"
        onClick={handleExport}
        disabled={selectedCount === 0 || isExporting}
      >
        {isExporting && <LoadingSpinner size="sm" />}
        {buttonText}
      </Button>

      {currentRender && (
        <OffscreenChartRenderer
          key={currentRender.chartType}
          post={post}
          chartType={currentRender.chartType}
          onRendered={handleRendered}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default ExportChartsTab;

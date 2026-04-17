"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef } from "react";

import { ThemeOverrideContainer } from "@/contexts/theme_override_context";
import { PostWithForecasts } from "@/types/post";
import { extractSvgString } from "@/utils/svg_export";

import ChartContent from "./chart_content";
import { tryGenerateProgrammaticSvg } from "../config/chart_data_helpers";
import {
  ExportableChartType,
  EXPORT_DIMENSIONS,
} from "../config/chart_exportables";

type Props = {
  post: PostWithForecasts;
  chartType: ExportableChartType;
  onRendered: (svgString: string) => void;
  onError: (error: Error) => void;
};

const PROGRAMMATIC_CHART_TYPES = new Set([
  ExportableChartType.RadialForecast,
  ExportableChartType.TableTop4,
  ExportableChartType.FullTable,
]);

const OffscreenChartRenderer: FC<Props> = ({
  post,
  chartType,
  onRendered,
  onError,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = EXPORT_DIMENSIONS[chartType];
  const hasCalledBack = useRef(false);

  useEffect(() => {
    if (!PROGRAMMATIC_CHART_TYPES.has(chartType)) return;

    const svgString = tryGenerateProgrammaticSvg(
      post,
      t,
      chartType,
      t("ifYes"),
      t("ifNo"),
      t("resolved"),
      locale
    );
    if (svgString !== null) {
      onRendered(svgString);
    } else {
      onError(new Error(`No data for ${chartType}`));
    }
  }, [chartType, post, onRendered, onError, t, locale]);

  const handleChartReady = useCallback(() => {
    setTimeout(() => {
      if (hasCalledBack.current) return;
      hasCalledBack.current = true;

      const container = containerRef.current;
      if (!container) {
        onError(new Error(`No container for ${chartType}`));
        return;
      }

      const svgString = extractSvgString(container);
      if (svgString) {
        onRendered(svgString);
      } else {
        onError(new Error(`No SVG found for ${chartType}`));
      }
    }, 500);
  }, [chartType, onRendered, onError]);

  // Safety timeout: if onChartReady never fires (e.g., no data for resolved
  // questions), error out instead of hanging forever.
  useEffect(() => {
    if (PROGRAMMATIC_CHART_TYPES.has(chartType)) return;

    const timerId = setTimeout(() => {
      if (hasCalledBack.current) return;
      hasCalledBack.current = true;
      onError(new Error(`Chart render timeout for ${chartType}`));
    }, 3000);

    return () => clearTimeout(timerId);
  }, [chartType, onError]);

  if (PROGRAMMATIC_CHART_TYPES.has(chartType)) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: "-200vw",
        top: 0,
        width: dimensions.width,
        height: dimensions.height,
        overflow: "hidden",
        backgroundColor: "white",
        pointerEvents: "none",
      }}
    >
      <ThemeOverrideContainer
        override="light"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <ChartContent
          post={post}
          chartType={chartType}
          dimensions={dimensions}
          onChartReady={handleChartReady}
          onNoData={() => {
            if (hasCalledBack.current) return;
            hasCalledBack.current = true;
            onError(new Error(`No data for ${chartType}`));
          }}
        />
      </ThemeOverrideContainer>
    </div>
  );
};

export default OffscreenChartRenderer;

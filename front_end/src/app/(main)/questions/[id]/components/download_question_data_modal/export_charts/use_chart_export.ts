"use client";

import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useCallback, useRef, useState } from "react";

import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { svgStringToBlob } from "@/utils/svg_export";

import { ExportableChartType } from "./config/chart_exportables";

export type RenderRequest = {
  chartType: ExportableChartType;
  resolve: (svgString: string) => void;
  reject: (error: Error) => void;
};

export function useChartExport(post: PostWithForecasts) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentRender, setCurrentRender] = useState<RenderRequest | null>(
    null
  );
  const collectedSvgs = useRef<Map<ExportableChartType, string>>(new Map());

  const handleRendered = useCallback(
    (svgString: string) => {
      if (currentRender) {
        currentRender.resolve(svgString);
      }
    },
    [currentRender]
  );

  const handleError = useCallback(
    (error: Error) => {
      if (currentRender) {
        currentRender.reject(error);
      }
    },
    [currentRender]
  );

  const exportCharts = useCallback(
    async (chartTypes: ExportableChartType[]) => {
      setIsExporting(true);
      collectedSvgs.current.clear();

      for (const chartType of chartTypes) {
        try {
          const svgString = await new Promise<string>((resolve, reject) => {
            setCurrentRender({ chartType, resolve, reject });
          });
          collectedSvgs.current.set(chartType, svgString);
        } catch (error) {
          console.warn(`Failed to export ${chartType}:`, error);
        }
      }

      const svgs = collectedSvgs.current;
      const title = (post.short_title || post.title || "charts").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

      if (svgs.size === 1) {
        const entry = [...svgs.entries()][0];
        if (entry) {
          const [type, svg] = entry;
          saveAs(svgStringToBlob(svg), `${title}_${type}.svg`);
        }
      } else if (svgs.size > 1) {
        const zip = new JSZip();
        for (const [type, svg] of svgs) {
          zip.file(`${title}_${type}.svg`, svg);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, `${title}_charts.zip`);
      }

      sendAnalyticsEvent("chartsExported", {
        postId: post.id,
        chartTypes,
        exportedCount: svgs.size,
      });

      setCurrentRender(null);
      setIsExporting(false);
    },
    [post.id, post.short_title, post.title]
  );

  return {
    exportCharts,
    isExporting,
    currentRender,
    handleRendered,
    handleError,
  };
}

"use client";

import { FC, useMemo } from "react";

import Tooltip from "@/components/ui/tooltip";
import cn from "@/utils/core/cn";

import { GroupTimelineMarker } from "./types";

type Props = {
  markers: GroupTimelineMarker[];
  chartWidth: number;
  chartHeight: number;
  xDomain: [number, number];
  chartPadding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  activeMarkerId?: string | null;
  onMarkerEnter?: (marker: GroupTimelineMarker) => void;
  onMarkerLeave?: (marker: GroupTimelineMarker) => void;
};

export const GROUP_TIMELINE_MARKER_SIZE = 12;

const GroupTimelineMarkersOverlay: FC<Props> = ({
  markers,
  chartWidth,
  chartHeight,
  xDomain,
  chartPadding,
  activeMarkerId,
  onMarkerEnter,
  onMarkerLeave,
}) => {
  const positionedMarkers = useMemo(() => {
    if (!markers.length) return [];

    const [xMin, xMax] = xDomain;
    const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
    if (plotWidth <= 0 || xMax <= xMin) return [];

    return markers
      .filter((marker) => marker.timestamp >= xMin && marker.timestamp <= xMax)
      .map((marker) => ({
        ...marker,
        xPixel:
          chartPadding.left +
          ((marker.timestamp - xMin) / (xMax - xMin)) * plotWidth,
      }));
  }, [markers, chartWidth, chartPadding, xDomain]);

  if (!positionedMarkers.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {positionedMarkers.map((marker) => {
        const isActive = marker.id === activeMarkerId;
        const tooltipContent = marker.label ? (
          <div className="space-y-0.5">
            <div className="font-medium">{marker.label}</div>
            {marker.dateLabel && (
              <div className="opacity-80">{marker.dateLabel}</div>
            )}
          </div>
        ) : (
          marker.dateLabel ?? "Activity"
        );

        return (
          <div
            key={marker.id}
            className="absolute inset-y-0"
            style={{ left: marker.xPixel, transform: "translateX(-50%)" }}
          >
            <div
              className={cn(
                "absolute w-0 border-l-2 border-dashed transition-colors",
                isActive
                  ? "border-purple-700 dark:border-purple-700-dark"
                  : "border-purple-400 dark:border-purple-400-dark"
              )}
              style={{
                left: 0,
                top: chartPadding.top,
                height: chartHeight - chartPadding.top - chartPadding.bottom,
                transform: "translateX(-50%)",
              }}
            />
            <div
              className="pointer-events-auto absolute"
              style={{
                bottom: chartPadding.bottom,
                transform: "translate(-50%, 50%)",
              }}
            >
              <Tooltip
                showDelayMs={100}
                placement="top"
                renderInPortal={false}
                tooltipContent={tooltipContent}
                tooltipClassName="border-blue-400 bg-gray-0 text-left text-gray-800 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-800-dark"
                className="block"
              >
                <button
                  type="button"
                  aria-label={
                    marker.label ?? marker.dateLabel ?? "Timeline marker"
                  }
                  className={cn(
                    "group flex items-center justify-center rounded-full p-1 outline-none transition-transform",
                    isActive && "scale-110"
                  )}
                  onMouseEnter={() => onMarkerEnter?.(marker)}
                  onMouseLeave={() => onMarkerLeave?.(marker)}
                  onFocus={() => onMarkerEnter?.(marker)}
                  onBlur={() => onMarkerLeave?.(marker)}
                >
                  <span
                    className={cn(
                      "block rounded-full border-2 transition-colors",
                      isActive
                        ? "border-purple-700 bg-purple-700 dark:border-purple-700-dark dark:bg-purple-700-dark"
                        : "border-purple-700 bg-gray-0 group-hover:border-purple-700 group-hover:bg-purple-200 dark:border-purple-700-dark dark:bg-gray-0-dark dark:group-hover:border-purple-700-dark dark:group-hover:bg-purple-200-dark"
                    )}
                    style={{
                      width: GROUP_TIMELINE_MARKER_SIZE,
                      height: GROUP_TIMELINE_MARKER_SIZE,
                    }}
                  />
                </button>
              </Tooltip>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupTimelineMarkersOverlay;

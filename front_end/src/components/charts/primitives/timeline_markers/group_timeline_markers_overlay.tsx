"use client";

import { ReactNode } from "react";
import { VictoryLine, VictoryPortal, VictoryScatter } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import { ThemeColor } from "@/types/theme";

import { GroupTimelineMarker } from "./types";

type RenderProps = {
  markers: GroupTimelineMarker[];
  yDomain: [number, number];
  plotTop: number;
  getThemeColor: (color: ThemeColor) => string;
  activeMarkerId?: string | null;
  onMarkerEnter?: (marker: GroupTimelineMarker) => void;
  onMarkerLeave?: (marker: GroupTimelineMarker) => void;
};

export const GROUP_TIMELINE_MARKER_SIZE = 5;
const HIT_AREA_WIDTH = 16;

type MarkerPointDatum = {
  x: number;
  y: number;
  plotTop: number;
  pointFill: string;
  pointStroke: string;
  onEnter: () => void;
  onLeave: () => void;
};

type MarkerPointProps = {
  x?: number;
  y?: number;
  datum?: MarkerPointDatum;
  size?: number;
};

function TimelineMarkerPoint({
  x,
  y,
  datum,
  size = GROUP_TIMELINE_MARKER_SIZE,
}: MarkerPointProps) {
  if (!datum || typeof x !== "number" || typeof y !== "number") return null;
  const { plotTop, pointFill, pointStroke, onEnter, onLeave } = datum;
  const hitTop = Math.min(plotTop, y);
  const hitHeight = Math.max(0, y - hitTop) + size + 4;

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <rect
        x={x - HIT_AREA_WIDTH / 2}
        y={hitTop}
        width={HIT_AREA_WIDTH}
        height={hitHeight}
        fill="transparent"
        pointerEvents="all"
      />
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={pointFill}
        stroke={pointStroke}
        strokeWidth={2}
      />
    </g>
  );
}

export function renderGroupTimelineMarkers({
  markers,
  yDomain,
  plotTop,
  getThemeColor,
  activeMarkerId,
  onMarkerEnter,
  onMarkerLeave,
}: RenderProps): ReactNode[] {
  if (!markers.length) return [];

  const [yMin, yMax] = yDomain;
  const elements: ReactNode[] = [];

  markers.forEach((marker) => {
    const isActive = marker.id === activeMarkerId;
    const lineColor = getThemeColor(
      isActive ? METAC_COLORS.purple["700"] : METAC_COLORS.purple["400"]
    );
    const pointStroke = getThemeColor(METAC_COLORS.purple["700"]);
    const pointFill = isActive
      ? pointStroke
      : getThemeColor(METAC_COLORS.gray["0"]);

    elements.push(
      <VictoryPortal key={`timeline-marker-line-portal-${marker.id}`}>
        <VictoryLine
          data={[
            { x: marker.timestamp, y: yMin },
            { x: marker.timestamp, y: yMax },
          ]}
          style={{
            data: {
              stroke: lineColor,
              strokeDasharray: "4,3",
              strokeWidth: 1.5,
              pointerEvents: "none",
            },
          }}
        />
      </VictoryPortal>
    );

    elements.push(
      <VictoryPortal key={`timeline-marker-point-portal-${marker.id}`}>
        <VictoryScatter
          data={[
            {
              x: marker.timestamp,
              y: yMin,
              plotTop,
              pointFill,
              pointStroke,
              onEnter: () => onMarkerEnter?.(marker),
              onLeave: () => onMarkerLeave?.(marker),
            },
          ]}
          dataComponent={<TimelineMarkerPoint />}
        />
      </VictoryPortal>
    );
  });

  return elements;
}

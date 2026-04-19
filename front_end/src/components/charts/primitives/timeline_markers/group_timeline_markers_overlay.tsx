"use client";

import { faComment, faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { ReactNode } from "react";
import { VictoryLine, VictoryScatter } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import { ThemeColor } from "@/types/theme";

import { ActivityType, GroupTimelineMarker } from "./types";

type RenderProps = {
  markers: GroupTimelineMarker[];
  yDomain: [number, number];
  getThemeColor: (color: ThemeColor) => string;
  activeMarkerId?: string | null;
  onMarkerEnter?: (marker: GroupTimelineMarker) => void;
  onMarkerLeave?: (marker: GroupTimelineMarker) => void;
};

export const GROUP_TIMELINE_MARKER_SIZE = 9;
const HIT_AREA_PADDING = 4;
const MARKER_ICON_DISPLAY_SIZE = 10;

const ACTIVITY_TYPE_ICON = {
  news: faNewspaper,
  comment: faComment,
} as const;

type MarkerPointDatum = {
  x: number;
  y: number;
  pointFill: string;
  pointStroke: string;
  iconColor: string;
  activityType?: ActivityType;
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
  const { pointFill, pointStroke, iconColor, activityType, onEnter, onLeave } =
    datum;
  const hitRadius = size + HIT_AREA_PADDING;

  const iconDef = activityType ? ACTIVITY_TYPE_ICON[activityType] : undefined;
  let iconTransform: string | undefined;
  let iconPath: string | undefined;
  if (iconDef) {
    const [viewW, viewH, , , rawPath] = iconDef.icon;
    iconPath = Array.isArray(rawPath) ? rawPath[0] : rawPath;
    const scale = MARKER_ICON_DISPLAY_SIZE / Math.max(viewW, viewH);
    const offsetX = x - (viewW * scale) / 2;
    const offsetY = y - (viewH * scale) / 2;
    iconTransform = `translate(${offsetX}, ${offsetY}) scale(${scale})`;
  }

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <circle
        cx={x}
        cy={y}
        r={hitRadius}
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
      {iconPath && iconTransform && (
        <g transform={iconTransform} pointerEvents="none">
          <path d={iconPath} fill={iconColor} />
        </g>
      )}
    </g>
  );
}

export function renderGroupTimelineMarkers({
  markers,
  yDomain,
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
    const iconColor = isActive
      ? getThemeColor(METAC_COLORS.gray["0"])
      : pointStroke;

    elements.push(
      <VictoryLine
        key={`${marker.id}-line`}
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
    );

    elements.push(
      <VictoryScatter
        key={`${marker.id}-point`}
        data={[
          {
            x: marker.timestamp,
            y: yMin,
            pointFill,
            pointStroke,
            iconColor,
            activityType: marker.type,
            onEnter: () => onMarkerEnter?.(marker),
            onLeave: () => onMarkerLeave?.(marker),
            size: GROUP_TIMELINE_MARKER_SIZE,
          },
        ]}
        dataComponent={<TimelineMarkerPoint />}
      />
    );
  });

  return elements;
}

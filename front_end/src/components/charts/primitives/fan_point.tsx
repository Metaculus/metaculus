"use client";

import { isNil } from "lodash";
import { ComponentProps, FC } from "react";
import { Point } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type Props = ComponentProps<typeof Point> & {
  activePoint: string | null;
  pointColor?: string;
  resolvedPointColor?: string;
  bgColor?: string;
  pointSize?: number;
  strokeWidth?: number;
  unsuccessfullyResolved?: boolean;
  bottomPadding?: number;
  isClosed?: boolean;
};

const FanPoint: FC<Props> = ({
  x,
  y,
  datum,
  activePoint,
  pointColor,
  resolvedPointColor,
  bgColor,
  pointSize = 10,
  strokeWidth = 2,
  unsuccessfullyResolved,
  bottomPadding,
  isClosed,
}) => {
  const { getThemeColor } = useAppTheme();
  const resolvedColor =
    resolvedPointColor ?? getThemeColor(METAC_COLORS.purple["800"]);
  const color =
    pointColor ?? datum?.pointColor ?? getThemeColor(METAC_COLORS.olive["800"]);
  const backgroundColor = bgColor ?? getThemeColor(METAC_COLORS.gray["0"]);

  const resolved = datum?.resolved;
  const active = datum?.x === activePoint;

  const innerSize = pointSize - 2;

  if (isNil(x) || isNil(y)) {
    return null;
  }
  const datumUnsuccess = datum?.unsuccessfullyResolved;
  const isAnnulled =
    typeof unsuccessfullyResolved === "boolean"
      ? unsuccessfullyResolved
      : !!datumUnsuccess;

  if (isAnnulled) {
    const circleSize = 8;
    const xSize = 3;

    return (
      <g>
        <line
          x1={x}
          y1={"5%"}
          x2={x}
          y2={`calc(100% - ${bottomPadding}px)`}
          stroke={getThemeColor(METAC_COLORS.purple[active ? "600" : "300"])}
          strokeWidth={1}
        />
        <circle
          cx={x}
          cy={y}
          r={circleSize}
          fill={bgColor ?? getThemeColor(METAC_COLORS.gray["200"])}
          stroke={getThemeColor(METAC_COLORS.purple["700"])}
          strokeWidth={active ? 2 : 1}
        />
        <g stroke={getThemeColor(METAC_COLORS.purple["700"])} strokeWidth={1.5}>
          <line x1={x - xSize} y1={y - xSize} x2={x + xSize} y2={y + xSize} />
          <line x1={x + xSize} y1={y - xSize} x2={x - xSize} y2={y + xSize} />
        </g>
      </g>
    );
  }

  if (isClosed) {
    return (
      <g>
        <line
          x1={x}
          y1={"0%"}
          x2={x}
          y2={`calc(100% - ${bottomPadding}px)`}
          stroke="url(#paint0_linear_1689_3152)"
          strokeWidth={1}
        />
        <defs>
          <linearGradient
            id="paint0_linear_1689_3152"
            x1="2.95811"
            y1="158"
            x2="2.95811"
            y2="-2.10106"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#C8CCCE" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </g>
    );
  }
  if (resolved) {
    return (
      <g transform={`rotate(45, ${x}, ${y})`}>
        <rect
          width={pointSize}
          height={pointSize}
          x={x - pointSize / 2}
          y={y - pointSize / 2}
          fill={backgroundColor}
          stroke={resolvedColor}
          strokeWidth={6}
          strokeOpacity={active ? 0.3 : 0}
        />
        <rect
          width={innerSize}
          height={innerSize}
          x={x - innerSize / 2}
          y={y - innerSize / 2}
          fill={backgroundColor}
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  return (
    <g>
      {active && (
        <line
          x1={x}
          y1={"5%"}
          x2={x}
          y2={`calc(100% - ${bottomPadding}px)`}
          stroke={getThemeColor(METAC_COLORS.blue["700"])}
          strokeWidth={1}
          strokeDasharray="6 2"
          opacity={0.5}
        />
      )}
      <rect
        width={pointSize}
        height={pointSize}
        x={x - pointSize / 2}
        y={y - pointSize / 2}
        rx={1}
        ry={1}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeOpacity={active ? 0.3 : 0}
      />
      <rect
        width={pointSize}
        height={pointSize}
        x={x - pointSize / 2}
        y={y - pointSize / 2}
        fill={color}
      />
    </g>
  );
};

export default FanPoint;

"use client";

import dynamic from "next/dynamic";
import React, { FC, useId, useMemo } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

type Props = {
  progress: number;
  segments: number;
};

const GAP_PX = 1;
const HEIGHT_PX = 10;
const RADIUS_PX = 1;

const SegmentedProgressBar: FC<Props> = ({ progress, segments }) => {
  const maskId = useId();
  const { getThemeColor } = useAppTheme();
  const { ref, width } = useContainerSize<HTMLDivElement>();

  const FILL_COLOR = getThemeColor(METAC_COLORS.olive["600"]);
  const EMPTY_COLOR = getThemeColor(METAC_COLORS.blue["400"]);
  const clamped = Math.max(0, Math.min(1, progress ?? 0));

  const svgWidth = Math.max(width || 0, segments + (segments - 1) * GAP_PX);

  const { segW, xs } = useMemo(() => {
    const totalGaps = (segments - 1) * GAP_PX;
    const segWidth = svgWidth > 0 ? (svgWidth - totalGaps) / segments : 0;
    const offsets = Array.from(
      { length: segments },
      (_, i) => i * (segWidth + GAP_PX)
    );
    return { segW: segWidth, xs: offsets };
  }, [segments, svgWidth]);

  return (
    <div ref={ref} className="relative w-full">
      <svg
        className="block w-full"
        viewBox={`0 0 ${svgWidth || 1} ${HEIGHT_PX}`}
        preserveAspectRatio="none"
        style={{ height: HEIGHT_PX }}
      >
        <g fill={EMPTY_COLOR}>
          {svgWidth > 0 &&
            xs.map((x, i) => (
              <rect
                key={i}
                x={x}
                y={0}
                width={segW}
                height={HEIGHT_PX}
                rx={RADIUS_PX}
              />
            ))}
        </g>

        <defs>
          <mask id={maskId}>
            <rect width={svgWidth || 1} height={HEIGHT_PX} fill="black" />
            <g fill="white">
              {svgWidth > 0 &&
                xs.map((x, i) => (
                  <rect
                    key={i}
                    x={x}
                    y={0}
                    width={segW}
                    height={HEIGHT_PX}
                    rx={RADIUS_PX}
                  />
                ))}
            </g>
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          <rect
            x={0}
            y={0}
            width={svgWidth || 1}
            height={HEIGHT_PX}
            fill={FILL_COLOR}
            style={{
              transform: `scaleX(${clamped})`,
              transformOrigin: "0 0",
              transition: "transform 750ms ease",
            }}
          />
        </g>
      </svg>
    </div>
  );
};

export default dynamic(() => Promise.resolve(SegmentedProgressBar), {
  ssr: false,
});

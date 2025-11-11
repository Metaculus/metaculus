import dynamic from "next/dynamic";
import React, { FC, useId } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

type Props = {
  progress: number;
  segments: number;
};

const SegmentedProgressBar: FC<Props> = ({ progress, segments }) => {
  const maskId = useId();
  const { getThemeColor } = useAppTheme();

  const GAP_PX = 1;
  const HEIGHT_PX = 10;
  const RADIUS_PX = 1;
  const FILL_COLOR = getThemeColor(METAC_COLORS.olive["600"]);
  const EMPTY_COLOR = getThemeColor(METAC_COLORS.blue["400"]);

  // Measure actual container width
  const { ref, width } = useContainerSize<HTMLDivElement>();

  // Compute pixel geometry
  const totalGaps = (segments - 1) * GAP_PX;
  const segW = width > 0 ? (width - totalGaps) / segments : 0;
  const xs = Array.from({ length: segments }, (_, i) => i * (segW + GAP_PX));

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height="10" className="block">
        {/* background */}
        <g fill={EMPTY_COLOR}>
          {width > 0 &&
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

        {/* mask */}
        <defs>
          <mask id={maskId}>
            <rect width={width} height={HEIGHT_PX} fill="black" />
            <g fill="white">
              {width > 0 &&
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

        {/* animated fill */}
        <g mask={`url(#${maskId})`}>
          <rect
            x={0}
            y={0}
            width={width}
            height={HEIGHT_PX}
            fill={FILL_COLOR}
            style={{
              transform: `scaleX(${progress})`,
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

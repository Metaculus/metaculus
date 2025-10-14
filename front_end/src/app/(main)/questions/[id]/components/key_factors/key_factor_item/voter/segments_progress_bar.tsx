import React, { FC, useId, useLayoutEffect, useRef, useState } from "react";

type Props = {
  progress: number;
  segments: number;
};

export const SegmentsProgressBar: FC<Props> = ({ progress, segments }) => {
  const maskId = useId();

  // --- visual constants ---
  const GAP_PX = 1;
  const HEIGHT_PX = 10;
  const RADIUS_PX = 1;
  const FILL_COLOR = "#8FA192";
  const EMPTY_COLOR = "#D7E0EE";

  // --- measure actual container width ---
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setWidth(Math.floor(cr.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- compute pixel geometry ---
  const totalGaps = (segments - 1) * GAP_PX;
  const segW = width > 0 ? (width - totalGaps) / segments : 0;
  const xs = Array.from({ length: segments }, (_, i) => i * (segW + GAP_PX));

  return (
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
            transform: `scaleX(${pct})`,
            transformOrigin: "0 0",
            transition: "transform 500ms ease",
          }}
        />
      </g>
    </svg>
  );
};

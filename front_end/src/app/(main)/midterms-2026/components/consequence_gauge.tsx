"use client";

import { FC } from "react";

// A compact version of the binary-CP radial gauge (see
// components/consumer_post_card/binary_cp_bar.tsx) sized for the Electoral
// Consequences table. Takes a raw percentage + a single color so each cell
// can be tinted to its column (Dem / Split / Rep).

const WIDTH = 67;
const HEIGHT = 42;
const STROKE = 7;
const ARC_ANGLE = Math.PI * 1.1;

type Props = {
  pct: number | null;
  color: string;
};

const ConsequenceGauge: FC<Props> = ({ pct, color }) => {
  const radius = (WIDTH - STROKE) / 2;
  const center = { x: WIDTH / 2, y: HEIGHT - STROKE };

  const background = describeArc(100, ARC_ANGLE, center, radius, 1);
  const progress =
    pct != null && pct > 0
      ? describeArc(pct, ARC_ANGLE, center, radius, pct > 90 ? 1 : 0)
      : null;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: WIDTH, height: HEIGHT }}
    >
      <svg width={WIDTH} height={HEIGHT} className="overflow-visible">
        <path
          d={background.path}
          fill="none"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Butt cap (no round) so the filled arc ends exactly at the tick
            instead of overflowing past it. */}
        {progress && (
          <path
            d={progress.path}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
          />
        )}
        {progress && (
          <line
            x1={
              progress.endPoint.x - 2 * Math.cos(progress.angle + Math.PI / 2)
            }
            y1={
              progress.endPoint.y - 2 * Math.sin(progress.angle + Math.PI / 2)
            }
            x2={
              progress.endPoint.x + 2 * Math.cos(progress.angle + Math.PI / 2)
            }
            y2={
              progress.endPoint.y + 2 * Math.sin(progress.angle + Math.PI / 2)
            }
            stroke={color}
            strokeWidth={STROKE + 3}
          />
        )}
      </svg>
      <span
        className="absolute inset-0 flex items-end justify-center pb-[3px] text-[13px] font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {pct != null ? `${Math.round(pct)}%` : "—"}
      </span>
    </div>
  );
};

function describeArc(
  percentage: number,
  arcAngle: number,
  center: { x: number; y: number },
  radius: number,
  isLargerFlag: 0 | 1
) {
  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + (percentage / 100) * arcAngle;
  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  return {
    path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargerFlag} 1 ${endX} ${endY}`,
    endPoint: { x: endX, y: endY },
    angle: endAngle,
  };
}

export default ConsequenceGauge;

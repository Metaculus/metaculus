import { FC } from "react";

import { MIDTERMS_COLORS } from "../constants";

type Props = {
  value: number;
  color?: string;
};

const DistributionCurve: FC<Props> = ({
  value,
  color = MIDTERMS_COLORS.demPrimary,
}) => {
  return (
    <div className="relative py-4">
      <svg
        viewBox="0 0 200 60"
        className="h-20 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="midtermsCurveGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M 0 60 Q 20 60 40 55 Q 60 45 80 30 Q 100 10 100 10 Q 100 10 120 30 Q 140 45 160 55 Q 180 60 200 60 Z"
          fill="url(#midtermsCurveGradient)"
        />
        <path
          d="M 0 60 Q 20 60 40 55 Q 60 45 80 30 Q 100 10 100 10 Q 100 10 120 30 Q 140 45 160 55 Q 180 60 200 60"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <line
          x1="100"
          y1="10"
          x2="100"
          y2="60"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        <circle cx="100" cy="60" r="5" fill={color} />
      </svg>
      <div className="mt-2 text-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
};

export default DistributionCurve;

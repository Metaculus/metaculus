import { FC, ReactNode, SVGProps, useId } from "react";

import cn from "@/utils/core/cn";

import { KIND_COLOR } from "./theme";
import { WorldQuestion } from "../data/questions";
import {
  DENSITY_HEIGHT,
  DENSITY_WIDTH,
  densityPaths,
} from "../helpers/area_section";
import { linearPosition } from "../helpers/forecast";

const AXIS_YEARS = [2026, 2040, 2050];

// Where the line for the end of a year falls, as a fraction of the width.
export const yearLineFraction = (year: number) => linearPosition(year + 1);

type Props = {
  question: WorldQuestion;
  year: number;
  className?: string;
  svgClassName: string;
  svgProps?: SVGProps<SVGSVGElement> & { [key: `data-${string}`]: string };
  children?: ReactNode;
};

// The forecast's density with the median dashed and the year's line solid;
// the part up to the year is filled.
const DensityChart: FC<Props> = ({
  question,
  year,
  className,
  svgClassName,
  svgProps,
  children,
}) => {
  const fadeId = useId();
  const color = KIND_COLOR[question.kind];
  const yearX = yearLineFraction(year) * DENSITY_WIDTH;
  const medianX = linearPosition(question.median) * DENSITY_WIDTH;
  const paths = densityPaths(question, yearX);

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${DENSITY_WIDTH} ${DENSITY_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden
        {...svgProps}
        className={cn("block w-full", svgClassName)}
      >
        <defs>
          <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={0.42} />
            <stop offset="1" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path
          d={paths.area}
          fill={`color-mix(in oklch, ${color} 6%, transparent)`}
        />
        {paths.areaToYear && (
          <path d={paths.areaToYear} fill={`url(#${fadeId})`} />
        )}
        <path
          d={paths.line}
          fill="none"
          stroke={color}
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={medianX}
          x2={medianX}
          y1={0}
          y2={DENSITY_HEIGHT}
          stroke="var(--wby-fg)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={yearX}
          x2={yearX}
          y1={0}
          y2={DENSITY_HEIGHT}
          stroke="var(--wby-year)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-[5px] flex justify-between text-[11px] tabular-nums text-[var(--wby-dim)]">
        {AXIS_YEARS.map((axisYear) => (
          <span key={axisYear}>{axisYear}</span>
        ))}
      </div>
      {children}
    </div>
  );
};

export default DensityChart;

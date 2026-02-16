"use client";
import { differenceInMilliseconds } from "date-fns";
import { FC, useEffect, useRef } from "react";

import { PostStatus, Resolution } from "@/types/post";
import cn from "@/utils/core/cn";
import {
  isSuccessfullyResolved,
  isUnsuccessfullyResolved,
} from "@/utils/questions/resolution";

const CLOCK_RADIUS = 10;

const DEFAULT_STROKE_CLASS = "stroke-blue-700 dark:stroke-blue-700-dark";
const DEFAULT_DOT_FILL_CLASS = "fill-blue-700 dark:fill-blue-700-dark";
const DEFAULT_CLOCK_FILL_CLASS = "fill-olive-500 dark:fill-olive-500-dark";

type Props = {
  status: PostStatus;
  published_at: string;
  open_time?: string | null;
  scheduled_close_time: string;
  resolution: Resolution | null;
  strokeClassName?: string;
  dotFillClassName?: string;
  clockFillClass?: string;
};

const PostStatusIcon: FC<Props> = ({
  status,
  scheduled_close_time,
  open_time,
  published_at,
  resolution,
  strokeClassName = DEFAULT_STROKE_CLASS,
  dotFillClassName = DEFAULT_DOT_FILL_CLASS,
  clockFillClass = DEFAULT_CLOCK_FILL_CLASS,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const resolvedBadly = isUnsuccessfullyResolved(resolution);
  const resolvedWell = isSuccessfullyResolved(resolution);
  const showClock =
    status !== PostStatus.RESOLVED && status !== PostStatus.DELETED;

  useEffect(() => {
    if (!svgRef.current || !showClock) return;

    const startTimeStr = open_time ?? published_at;

    const start = new Date(startTimeStr);
    const close = new Date(scheduled_close_time);
    const now = new Date();

    const totalRaw = differenceInMilliseconds(close, start);
    const totalTime = Math.max(1, totalRaw);
    const sinceStart = Math.max(0, differenceInMilliseconds(now, start));

    const timeElapsed = Math.min(1, sinceStart / totalTime);

    const { x, y } = calculateCoordinates(timeElapsed);
    const pathD = buildClockPath(x, y, timeElapsed);

    const nodes = svgRef.current.children;

    const shadedPath = nodes[0];
    shadedPath?.setAttribute("d", pathD);

    const outerCircle = nodes[1];
    outerCircle?.setAttribute("r", CLOCK_RADIUS.toString());

    const radius = nodes[2];
    radius?.setAttribute("x2", x.toString());
    radius?.setAttribute("y2", y.toString());
  }, [scheduled_close_time, open_time, published_at, showClock]);

  const renderIcon = () => {
    // TODO: BE need to support this status
    // if (status === QuestionStatus.Closes) {
    //   return <circle r="10" className="stroke-blue-700 stroke-1" />;
    // }

    if (status === PostStatus.PENDING) {
      return (
        <>
          <path d="" className={clockFillClass} />
          <circle r="10" strokeWidth="1" className={strokeClassName} />
          <text
            x="0"
            y="4"
            fontSize="14"
            fontWeight="bold"
            fill="currentColor"
            textAnchor="middle"
          >
            ?
          </text>
        </>
      );
    }

    if (showClock) {
      return (
        <>
          <path d="" className={clockFillClass} />
          <circle
            className={cn(strokeClassName, "stroke-1", {
              "fill-gray-300 opacity-75 dark:fill-gray-300-dark":
                status === PostStatus.CLOSED,
            })}
          />
          <line x1="0" y1="0" className={cn(strokeClassName, "stroke-1")} />
          <circle cx="0" cy="0" r="1" className={dotFillClassName} />
        </>
      );
    }

    if (resolvedWell) {
      return (
        <>
          <circle r="10" strokeWidth="1" className={strokeClassName} />
          <path
            d="M 0 -5 L 5 0 L 0 5 L -5 0 Z"
            fill="none"
            strokeWidth="2.5"
            className="stroke-purple-800 dark:stroke-purple-800-dark"
          />
        </>
      );
    }

    if (resolvedBadly) {
      return (
        <>
          <circle r="10" strokeWidth="1" className={strokeClassName} />
          <line
            x1="-4"
            y1="-4"
            x2="4"
            y2="4"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-purple-800 dark:stroke-purple-800-dark"
          />
          <line
            x1="4"
            y1="-4"
            x2="-4"
            y2="4"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-purple-800 dark:stroke-purple-800-dark"
          />
        </>
      );
    }

    return null;
  };

  return (
    <svg
      ref={svgRef}
      width="20"
      height="20"
      viewBox="-12 -12 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderIcon()}
    </svg>
  );
};

const calculateCoordinates = (timeElapsed: number) => {
  const angle = 2 * Math.PI * timeElapsed;
  const x = CLOCK_RADIUS * Math.sin(angle);
  const y = -CLOCK_RADIUS * Math.cos(angle);

  return { x, y };
};

const buildClockPath = (x: number, y: number, timeElapsed: number) => {
  const largeArcFlag = timeElapsed > 0.5 ? 1 : 0;
  return `M 0 0 L ${x} ${y} A ${CLOCK_RADIUS} ${CLOCK_RADIUS} 0 ${largeArcFlag} 0 0 ${-CLOCK_RADIUS} z`;
};

export default PostStatusIcon;

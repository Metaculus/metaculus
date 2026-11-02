"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, PointerEvent, useId, useMemo, useRef, useState } from "react";

import { PredictionsByMonth } from "@/services/api/misc/misc.shared";
import cn from "@/utils/core/cn";

import { CHART_EVENTS, ChartEvent } from "./predictions_chart_events";

// Geometry of the original 1100x422 design frame
const WIDTH = 1100;
const HEIGHT = 422;
const X_START = 18;
const X_END = 1075;
const Y_ZERO = 367.8;
const Y_TOP = 62;
const TITLE_LINE_HEIGHT = 18.2;
const SUBTITLE_GAP = 22;
const ARROW_LENGTH = 26;

// The chart is pulled up under the hero text; only accept pointer input
// where it does not overlap that text.
const HERO_OVERLAP_HEIGHT = 170;
const HERO_OVERLAP_WIDTH = 700;

type Point = { x: number; y: number; month: string; value: number };
type LabelLine = { text: string; sub: boolean };

const monthIndex = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return (year ?? 0) * 12 + (m ?? 1) - 1;
};

const monthToDate = (month: string) => new Date(`${month}-01T00:00:00Z`);

function gridStep(max: number) {
  for (const step of [1e6, 2e6, 5e6, 1e7, 2e7, 5e7]) {
    if (max / step <= 6) return step;
  }
  return 1e8;
}

type Props = {
  series: PredictionsByMonth;
  className?: string;
};

const PredictionsChart: FC<Props> = ({ series, className }) => {
  const t = useTranslations();
  const locale = useLocale();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<Point | null>(null);

  const chart = useMemo(() => {
    const firstPoint = series[0];
    const lastPoint = series[series.length - 1];
    if (!firstPoint || !lastPoint || series.length < 2) return null;

    // Start a few months before the first data point so the founding marker
    // has room to the left.
    const first = monthIndex(firstPoint.month) - 3;
    const last = monthIndex(lastPoint.month);
    const max = lastPoint.cumulative;

    const sx = (month: string) =>
      X_START +
      ((X_END - X_START) * (monthIndex(month) - first)) / (last - first);
    const sy = (value: number) => Y_ZERO - ((Y_ZERO - Y_TOP) * value) / max;

    const points: Point[] = series.map(({ month, cumulative }) => ({
      x: sx(month),
      y: sy(cumulative),
      month,
      value: cumulative,
    }));

    // Arrow continues the slope of the last three months
    const tail = points[points.length - 1];
    const prev = points[Math.max(0, points.length - 4)];
    if (!tail || !prev) return null;
    const angle = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const tip = {
      x: tail.x + ARROW_LENGTH * Math.cos(angle),
      y: tail.y + ARROW_LENGTH * Math.sin(angle),
    };
    const head = [angle + Math.PI - 0.42, angle + Math.PI + 0.42]
      .map((a) => `${tip.x + 11 * Math.cos(a)} ${tip.y + 11 * Math.sin(a)}`)
      .join("L");

    const line =
      "M" + points.map((p) => `${p.x} ${p.y}`).join("L") + `L${tip.x} ${tip.y}`;
    const area = `${line}L${WIDTH + 2} ${tip.y}V${HEIGHT + 140}H0V${Y_ZERO}Z`;

    const step = gridStep(max);
    const grid: { y: number; label?: string }[] = [];
    for (let v = step; v <= max; v += step) {
      grid.push({
        y: sy(v),
        label:
          Math.round(v / step) % 2 === 0
            ? new Intl.NumberFormat(locale, { notation: "compact" }).format(v)
            : undefined,
      });
    }

    const valueAt = (month: string) => {
      const idx = monthIndex(month);
      let value = 0;
      for (const p of series) {
        if (monthIndex(p.month) > idx) break;
        value = p.cumulative;
      }
      return value;
    };

    const events = CHART_EVENTS.filter(
      (e) => monthIndex(e.month) >= first && monthIndex(e.month) <= last
    ).map((event) => ({
      event,
      x: sx(event.month),
      y: sy(valueAt(event.month)),
    }));

    return { points, line, area, tip, head, grid, events };
  }, [series, locale]);

  if (!chart) return null;

  const formatMonth = (month: string, yearOnly?: boolean) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: yearOnly ? undefined : "long",
      timeZone: "UTC",
    }).format(monthToDate(month));

  const handlePointer = (e: PointerEvent<SVGRectElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) * WIDTH) / rect.width;
    let best: Point | null = null;
    for (const p of chart.points) {
      if (!best || Math.abs(p.x - x) < Math.abs(best.x - x)) best = p;
    }
    setActive(best);
  };

  return (
    <div className={cn("pointer-events-none relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible font-sans"
        role="img"
        aria-label={t("aboutChartAxisCaption").replace("\n", " ")}
      >
        <defs>
          <linearGradient
            id={`${uid}-area`}
            x1="0"
            y1="296"
            x2="1102"
            y2="296"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#00467F" />
            <stop offset="1" stopColor="#A5CC82" />
          </linearGradient>
          <filter
            id={`${uid}-shadow`}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feDropShadow
              dx="0"
              dy="1.12"
              stdDeviation="1.12"
              floodColor="#3751FF"
              floodOpacity="0.2"
            />
          </filter>
          <clipPath id={`${uid}-clip`}>
            <rect width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath={`url(#${uid}-clip)`}>
          <path
            d={chart.area}
            fill={`url(#${uid}-area)`}
            className="[fill-opacity:0.4] dark:[fill-opacity:0.8]"
          />
          <path
            d={chart.area}
            className="fill-blue-200 opacity-40 dark:fill-blue-50-dark"
          />

          {chart.grid.map(({ y, label }) => {
            // Lines that would cross the hero text start to its right
            const x1 = y < HERO_OVERLAP_HEIGHT ? HERO_OVERLAP_WIDTH : X_START;
            return (
              <g key={y}>
                <line
                  x1={x1}
                  x2={WIDTH}
                  y1={y}
                  y2={y}
                  strokeWidth={1}
                  className="stroke-[#4F6882] [stroke-opacity:0.16] dark:stroke-[#92ACC8] dark:[stroke-opacity:0.2]"
                />
                {label && (
                  <text
                    x={x1}
                    y={y - 4}
                    fontSize={10.6}
                    className="fill-[#4F6882] dark:fill-[#D7E4F2]"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x={X_START}
            y={Y_ZERO - 4}
            fontSize={10.6}
            className="fill-[#4F6882] dark:fill-[#D7E4F2]"
          >
            0
          </text>

          <path
            d={chart.line}
            fill="none"
            strokeWidth={1.92}
            strokeLinejoin="round"
            className="stroke-[#4F6882] dark:stroke-[#92ACC8]"
          />
          <path
            d={`M${chart.tip.x} ${chart.tip.y}L${chart.head}Z`}
            className="fill-[#4F6882] dark:fill-[#92ACC8]"
          />

          <g
            className={cn(
              "transition-opacity duration-150",
              active && "opacity-25"
            )}
          >
            {chart.events.map(({ event, x, y }) => (
              <EventMarker
                key={event.month}
                event={event}
                x={x}
                y={y}
                uid={uid}
                title={t(event.titleKey as Parameters<typeof t>[0])}
                subtitle={formatMonth(event.month, event.yearOnly)}
              />
            ))}
          </g>

          <AxisCaption text={t("aboutChartAxisCaption")} />

          {active && (
            <g>
              <line
                x1={active.x}
                x2={active.x}
                y1={active.y}
                y2={Y_ZERO}
                strokeWidth={1}
                strokeDasharray="3 3"
                className="stroke-[#2F4155] [stroke-opacity:0.6] dark:stroke-[#D7E4F2]"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r={4.5}
                strokeWidth={2}
                className="fill-white stroke-[#2F4155] dark:fill-blue-50-dark dark:stroke-white"
              />
            </g>
          )}
        </g>

        <rect
          x={0}
          y={HERO_OVERLAP_HEIGHT}
          width={WIDTH}
          height={HEIGHT - HERO_OVERLAP_HEIGHT}
          fill="transparent"
          className="pointer-events-auto"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
        />
        <rect
          x={HERO_OVERLAP_WIDTH}
          y={0}
          width={WIDTH - HERO_OVERLAP_WIDTH}
          height={HERO_OVERLAP_HEIGHT}
          fill="transparent"
          className="pointer-events-auto"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setActive(null)}
        />
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute whitespace-nowrap rounded bg-[#2F4155] px-2 py-1 text-xs text-white shadow dark:bg-[#D7E4F2] dark:text-blue-50-dark"
          style={{
            left: `${(active.x / WIDTH) * 100}%`,
            top: `${(Math.max(4, active.y - 46) / HEIGHT) * 100}%`,
            transform:
              active.x > WIDTH * 0.8
                ? "translateX(calc(-100% - 12px))"
                : "translateX(12px)",
          }}
        >
          <div className="font-bold">{formatMonth(active.month)}</div>
          <div className="tabular-nums">
            {t("aboutChartPredictionsCount", {
              count: active.value.toLocaleString(locale),
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const EventMarker: FC<{
  event: ChartEvent;
  x: number;
  y: number;
  uid: string;
  title: string;
  subtitle: string;
}> = ({ event, x, y, uid, title, subtitle }) => {
  const titleLines = title.split("\n");
  const labelX = x + (event.dx ?? 0);
  const above = event.side === "above";

  // Subtitle sits under the title, except for the founding marker and
  // labels below the line where the date reads first.
  const subtitleFirst = event.origin || !above;
  const titleItems: LabelLine[] = titleLines.map((text) => ({
    text,
    sub: false,
  }));
  const subtitleItem: LabelLine = { text: subtitle, sub: true };
  const lines = subtitleFirst
    ? [subtitleItem, ...titleItems]
    : [...titleItems, subtitleItem];

  const leaderEnd = above ? y - event.leader : y + event.leader;
  const ys: number[] = [];
  if (above) {
    let cursor = leaderEnd - 6;
    for (const line of [...lines].reverse()) {
      ys.unshift(cursor);
      cursor -= line.sub ? SUBTITLE_GAP : TITLE_LINE_HEIGHT;
    }
  } else {
    let cursor = leaderEnd + 15;
    for (const line of lines) {
      ys.push(cursor);
      cursor += line.sub ? SUBTITLE_GAP : TITLE_LINE_HEIGHT;
    }
  }
  const leaderStop = above ? y - 8 : y + 8;

  return (
    <g>
      {event.leader > 0 && (
        <>
          <defs>
            <linearGradient
              id={`${uid}-leader-${event.month}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={leaderEnd}
              x2="0"
              y2={y}
            >
              <stop stopColor="#F7F7F8" stopOpacity="0" />
              <stop offset="0.5" stopColor="#4F6882" stopOpacity="0.5" />
              <stop offset="1" stopColor="#4F6882" />
            </linearGradient>
            <linearGradient
              id={`${uid}-leader-dark-${event.month}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={leaderEnd}
              x2="0"
              y2={y}
            >
              <stop stopColor="#292929" stopOpacity="0" />
              <stop offset="0.5" stopColor="#C7DBF1" stopOpacity="0.5" />
              <stop offset="1" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <line
            x1={x}
            x2={x}
            y1={leaderEnd}
            y2={leaderStop}
            stroke={`url(#${uid}-leader-${event.month})`}
            strokeWidth={2.23}
            strokeDasharray="6.7 2.23"
            className="dark:hidden"
          />
          <line
            x1={x}
            x2={x}
            y1={leaderEnd}
            y2={leaderStop}
            stroke={`url(#${uid}-leader-dark-${event.month})`}
            strokeWidth={2.23}
            strokeDasharray="6.7 2.23"
            className="hidden dark:inline"
          />
        </>
      )}

      {event.origin ? (
        <circle
          cx={x}
          cy={y}
          r={7.26}
          strokeWidth={2.23}
          className="fill-[#EFF4F4] stroke-[#4F6882] dark:fill-blue-50-dark dark:stroke-white"
        />
      ) : (
        <>
          <circle
            cx={x}
            cy={y}
            r={14.52}
            fill="none"
            strokeWidth={2.23}
            className="stroke-[#283441] opacity-[0.16]"
          />
          <circle
            cx={x}
            cy={y}
            r={7.82}
            filter={`url(#${uid}-shadow)`}
            className="fill-white dark:fill-blue-50-dark"
          />
          <circle
            cx={x}
            cy={y}
            r={5.59}
            fill="none"
            strokeWidth={4.47}
            className="stroke-[#2F4155] dark:stroke-white"
          />
        </>
      )}

      {lines.map((line, i) => (
        <text
          key={i}
          x={labelX}
          y={ys[i]}
          textAnchor={event.anchor}
          fontSize={line.sub ? 14 : 15}
          fontWeight={line.sub ? 400 : 700}
          letterSpacing={line.sub ? 0.11 : 0.22}
          className={
            line.sub
              ? "fill-black opacity-50 dark:fill-white"
              : "fill-[#2F4155] dark:fill-[#D7E4F2]"
          }
        >
          {line.text}
        </text>
      ))}
    </g>
  );
};

const AxisCaption: FC<{ text: string }> = ({ text }) => {
  const [first, second] = text.split("\n");
  return (
    <g className="fill-[#4F6882] dark:fill-[#D7E4F2]">
      <path d="M18 384.924L15.9173 388.531L20.0827 388.531L18 384.924ZM18 404.163L20.0827 400.556L15.9173 400.556L18 404.163ZM18 388.115L17.6389 388.115L17.6389 400.973L18 400.973L18.3611 400.973L18.3611 388.115L18 388.115Z" />
      <text x={26.7} y={392} fontSize={10.6}>
        {first}
      </text>
      {second && (
        <text x={26.7} y={403.6} fontSize={10.6}>
          {second}
        </text>
      )}
    </g>
  );
};

export default PredictionsChart;

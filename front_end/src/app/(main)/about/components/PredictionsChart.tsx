"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  FC,
  PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { PredictionsByMonth } from "@/services/api/misc/misc.shared";
import cn from "@/utils/core/cn";

import { ChartCall, LeadUp, leadUp } from "./predictions_chart_calls";
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

// The spotlight moves to the next call every SPOTLIGHT_MS. It pauses while
// the pointer or keyboard focus is on the chart, offscreen, in a hidden tab,
// and for reduced motion (WCAG 2.2.2).
const SPOTLIGHT_MS = 7000;
// Spotlight card size, in chart units (about 1 px at the xl breakpoint)
const CARD_W = 236;
const CARD_H = 142;
// The lead-up band on the main chart is only a few units wide at this
// scale; keep it visible
const MIN_BAND_W = 4;

// Y-axis labels are right-aligned at this x
const Y_LABEL_X = WIDTH - 2;

type Point = { x: number; y: number; month: string; value: number };
type LabelLine = { text: string; kind: "title" | "sub" | "badge" };
// Lead-up band on the main chart: its x range and the line height at each end
type Band = { x0: number; x1: number; y0: number; y1: number };

const monthIndex = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return (year ?? 0) * 12 + (m ?? 1) - 1;
};

// Fractional month index of a "YYYY-MM-DD" day
const dayIndex = (date: string) => {
  const [year = 0, m = 1, d = 1] = date.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return year * 12 + m - 1 + (d - 1) / daysInMonth;
};

const eventId = (event: ChartEvent) => `${event.date}-${event.titleKey}`;

const monthToDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
const dayToDate = (date: string) => new Date(`${date}T00:00:00Z`);

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
  const [spotlight, setSpotlight] = useState<string | null>(null);

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

    const sxDay = (date: string) =>
      X_START + ((X_END - X_START) * (dayIndex(date) - first)) / (last - first);
    // Height of the drawn line at x, so markers sit on it between months
    const lineY = (x: number) => {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        if (a && b && x <= b.x) {
          return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
        }
      }
      return tail.y;
    };

    const events = CHART_EVENTS.filter(
      (e) => dayIndex(e.date) >= first && dayIndex(e.date) <= last + 1
    ).map((event) => {
      const x = sxDay(event.date);
      const lead = event.call ? leadUp(event.call) : null;
      // Lead-up band: from the day the call held to the event
      let band: Band | null = null;
      if (lead) {
        const x1 = x;
        const x0 = Math.min(sxDay(lead.since), x1 - MIN_BAND_W);
        band = { x0, x1, y0: lineY(x0), y1: lineY(x1) };
      }
      return { event, x, y: lineY(x), lead, band };
    });

    return { points, line, area, tip, head, grid, events };
  }, [series, locale]);

  const callIds = useMemo(
    () =>
      (chart?.events ?? [])
        .filter(({ lead }) => lead)
        .map(({ event }) => eventId(event)),
    [chart]
  );
  const initialSpotlight =
    (chart?.events ?? [])
      .filter(({ lead, event }) => lead && event.initial)
      .map(({ event }) => eventId(event))[0] ?? callIds[0];
  const current = spotlight ?? initialSpotlight;

  // The spotlight waits while the pointer or keyboard focus is on the chart,
  // and for a full interval after the pointer leaves
  const pausedRef = useRef(false);
  const resumeAtRef = useRef(0);
  const handleEnter = () => {
    pausedRef.current = true;
  };
  const handleLeave = () => {
    pausedRef.current = false;
    resumeAtRef.current = Date.now() + SPOTLIGHT_MS;
    setActive(null);
  };
  const focus = (id: string) => {
    setActive(null);
    setSpotlight(id);
  };
  useEffect(() => {
    if (callIds.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = true;
    const observer =
      svgRef.current && "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            onScreen = !!entry?.isIntersecting;
          })
        : null;
    if (observer && svgRef.current) observer.observe(svgRef.current);

    const timer = window.setInterval(() => {
      if (
        pausedRef.current ||
        Date.now() < resumeAtRef.current ||
        !onScreen ||
        document.hidden
      ) {
        return;
      }
      setSpotlight((prev) => {
        const idx = callIds.indexOf(prev ?? initialSpotlight ?? "");
        return callIds[(idx + 1) % callIds.length] ?? null;
      });
    }, SPOTLIGHT_MS);

    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
    };
  }, [callIds, initialSpotlight]);

  if (!chart) return null;

  const formatMonth = (month: string, yearOnly?: boolean) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: yearOnly ? undefined : "long",
      timeZone: "UTC",
    }).format(monthToDate(month));

  const formatDay = (date: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(dayToDate(date));

  const formatThreshold = (call: ChartCall) =>
    new Intl.NumberFormat(
      locale,
      call.kind === "probability"
        ? { style: "percent" }
        : { notation: "compact" }
    ).format(call.thresholdDisplay);

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
    <div
      className={cn("pointer-events-none relative", className)}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block h-auto w-full overflow-visible font-sans"
        role="img"
        aria-label={t("aboutChartAxisCaption").replace("\n", " ")}
      >
        <defs>
          {/* Vertical: blue at the bottom, green toward the top of the line */}
          <linearGradient
            id={`${uid}-area`}
            x1="0"
            y1={HEIGHT}
            x2="0"
            y2={Y_TOP}
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
                    x={Y_LABEL_X}
                    y={y - 4}
                    textAnchor="end"
                    fontSize={10.6}
                    className="fill-[#4F6882] dark:fill-[#D7E4F2]"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          {/* Zero line at 75% of the other gridlines' opacity */}
          <line
            x1={X_START}
            x2={WIDTH}
            y1={Y_ZERO}
            y2={Y_ZERO}
            strokeWidth={1}
            className="stroke-[#4F6882] [stroke-opacity:0.12] dark:stroke-[#92ACC8] dark:[stroke-opacity:0.15]"
          />
          <text
            x={Y_LABEL_X}
            y={Y_ZERO - 4}
            textAnchor="end"
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
            {chart.events.map(({ event, band }) => {
              if (!band) return null;
              const id = eventId(event);
              const isSpot = id === current;
              const card = event.card;
              return (
                <g key={`band-${id}`}>
                  {/* Zoom lens from the lead-up band to the card */}
                  {card && (
                    <polygon
                      points={lensPoints(band, card)}
                      className={cn(
                        "fill-olive-500 transition-opacity duration-500 dark:fill-olive-500-dark",
                        isSpot ? "opacity-25" : "opacity-0"
                      )}
                    />
                  )}
                  <polygon
                    points={`${band.x0},${band.y0} ${band.x1},${band.y1} ${band.x1},${Y_ZERO} ${band.x0},${Y_ZERO}`}
                    className={cn(
                      "fill-olive-700 transition-opacity duration-500 dark:fill-olive-500-dark",
                      isSpot ? "opacity-50" : "opacity-20"
                    )}
                  />
                </g>
              );
            })}
            {chart.events.map(({ event, x, y, lead }) => {
              const id = eventId(event);
              // The spotlight card stands in for the label
              const labelShown = !(lead && event.card && id === current);
              return (
                <EventMarker
                  key={id}
                  event={event}
                  x={x}
                  y={y}
                  uid={uid}
                  labelShown={labelShown}
                  title={t(event.titleKey as Parameters<typeof t>[0])}
                  subtitle={
                    lead
                      ? t("aboutChartDaysAhead", { days: lead.days })
                      : formatMonth(event.date.slice(0, 7), event.yearOnly)
                  }
                />
              );
            })}
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

        {/* Calls take the pointer over the scrub so their spotlight can be
            picked by hovering, tapping or tabbing to the marker */}
        {chart.events.map(({ event, x, y, lead }) => {
          if (!lead) return null;
          const id = eventId(event);
          return (
            <circle
              key={`hit-${id}`}
              cx={x}
              cy={y}
              r={18}
              fill="transparent"
              tabIndex={0}
              role="button"
              aria-label={`${t(event.titleKey as Parameters<typeof t>[0]).replace(/\n/g, " ")}, ${t("aboutChartDaysAhead", { days: lead.days })}`}
              aria-pressed={id === current}
              className="pointer-events-auto cursor-pointer outline-none"
              onPointerEnter={() => focus(id)}
              onPointerDown={() => focus(id)}
              onFocus={() => focus(id)}
            />
          );
        })}
      </svg>

      {chart.events.map(({ event, lead }) => {
        if (!lead || !event.call || !event.card) return null;
        const id = eventId(event);
        const isSpot = id === current;
        return (
          <SpotlightCard
            key={`card-${id}`}
            call={event.call}
            lead={lead}
            card={event.card}
            shown={isSpot && !active}
            title={t(event.titleKey as Parameters<typeof t>[0]).replace(
              /\n/g,
              " "
            )}
            date={formatDay(event.date)}
            headline={t("aboutChartCalledAhead", { days: lead.days })}
            caption={t("aboutChartCallSince", {
              kind: event.call.kind,
              threshold: formatThreshold(event.call),
              date: formatDay(lead.since),
            })}
            question={t(event.call.questionKey as Parameters<typeof t>[0])}
            thresholdLabel={formatThreshold(event.call)}
          />
        );
      })}

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
  labelShown: boolean;
  title: string;
  subtitle: string;
}> = ({ event, x, y, uid, labelShown, title, subtitle }) => {
  const labelX = x + (event.dx ?? 0);
  const above = event.side === "above";

  // The founding marker reads date first. Elsewhere the title comes first,
  // then the date, or for a call how many days ahead it was forecast.
  const titleItems: LabelLine[] = title
    .split("\n")
    .map((text) => ({ text, kind: "title" }));
  const subtitleItem: LabelLine = {
    text: subtitle,
    kind: event.call ? "badge" : "sub",
  };
  const lines = event.origin
    ? [subtitleItem, ...titleItems]
    : [...titleItems, subtitleItem];

  const leaderEnd = above ? y - event.leader : y + event.leader;
  const ys: number[] = [];
  if (above) {
    let cursor = leaderEnd - 6;
    for (const line of [...lines].reverse()) {
      ys.unshift(cursor);
      cursor -= line.kind === "title" ? TITLE_LINE_HEIGHT : SUBTITLE_GAP;
    }
  } else {
    let cursor = leaderEnd + 15;
    for (const line of lines) {
      ys.push(cursor);
      cursor += line.kind === "title" ? TITLE_LINE_HEIGHT : SUBTITLE_GAP;
    }
  }
  const leaderStop = above ? y - 8 : y + 8;

  return (
    <g>
      <g>
        {event.leader > 0 && (
          <>
            <defs>
              <linearGradient
                id={`${uid}-leader-${eventId(event)}`}
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
                id={`${uid}-leader-dark-${eventId(event)}`}
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
            <g
              className={cn(
                "transition-opacity duration-500",
                labelShown ? "opacity-100" : "opacity-0"
              )}
            >
              <line
                x1={x}
                x2={x}
                y1={leaderEnd}
                y2={leaderStop}
                stroke={`url(#${uid}-leader-${eventId(event)})`}
                strokeWidth={2.23}
                strokeDasharray="6.7 2.23"
                className="dark:hidden"
              />
              <line
                x1={x}
                x2={x}
                y1={leaderEnd}
                y2={leaderStop}
                stroke={`url(#${uid}-leader-dark-${eventId(event)})`}
                strokeWidth={2.23}
                strokeDasharray="6.7 2.23"
                className="hidden dark:inline"
              />
            </g>
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
      </g>

      <g
        className={cn(
          "transition-opacity duration-500",
          labelShown ? "opacity-100" : "opacity-0"
        )}
        aria-hidden={!labelShown}
      >
        {lines.map((line, i) => (
          <text
            key={i}
            x={labelX}
            y={ys[i]}
            textAnchor={event.anchor}
            fontSize={line.kind === "title" ? 15 : 14}
            fontWeight={line.kind === "sub" ? 400 : 700}
            letterSpacing={line.kind === "title" ? 0.22 : 0.11}
            className={
              line.kind === "title"
                ? "fill-[#2F4155] dark:fill-[#D7E4F2]"
                : line.kind === "badge"
                  ? "fill-olive-800 dark:fill-olive-800-dark"
                  : "fill-black opacity-50 dark:fill-white"
            }
          >
            {line.text}
          </text>
        ))}
      </g>
    </g>
  );
};

// Fan from the lead-up band on the line to the card edge facing it
function lensPoints(band: Band, card: { x: number; y: number }) {
  const start = `${band.x0},${band.y0}`;
  const end = `${band.x1},${band.y1}`;
  const left = card.x;
  const right = card.x + CARD_W;
  const top = card.y;
  const bottom = card.y + CARD_H;
  if (band.x0 > right) {
    // Card to the left: its right edge
    return `${start} ${right},${bottom} ${right},${top} ${end}`;
  }
  // Card above the band, or above and to its right
  return `${start} ${left},${bottom} ${right},${bottom} ${end}`;
}

const SpotlightCard: FC<{
  call: ChartCall;
  lead: LeadUp;
  card: { x: number; y: number };
  shown: boolean;
  title: string;
  date: string;
  headline: string;
  caption: string;
  question: string;
  thresholdLabel: string;
}> = ({
  call,
  lead,
  card,
  shown,
  title,
  date,
  headline,
  caption,
  question,
  thresholdLabel,
}) => (
  <div
    aria-hidden={!shown}
    className={cn(
      "not-prose absolute flex flex-col rounded border border-blue-400 bg-white px-3 py-2 shadow-md transition-opacity duration-500 dark:border-blue-400-dark dark:bg-blue-900",
      shown ? "pointer-events-auto opacity-100" : "opacity-0"
    )}
    style={{
      left: `${(card.x / WIDTH) * 100}%`,
      top: `${(card.y / HEIGHT) * 100}%`,
      width: `${(CARD_W / WIDTH) * 100}%`,
      height: `${(CARD_H / HEIGHT) * 100}%`,
    }}
  >
    <div className="flex gap-2 text-[11px] leading-4 text-gray-600 dark:text-gray-600-dark">
      <span className="truncate">{title}</span>
      <span className="ml-auto shrink-0">{date}</span>
    </div>
    <div className="text-[15px] font-bold leading-5 text-olive-800 dark:text-olive-800-dark">
      {headline}
    </div>
    <CallSparkline call={call} lead={lead} thresholdLabel={thresholdLabel} />
    <div className="text-[10px] leading-3 text-gray-600 dark:text-gray-600-dark">
      {caption}
    </div>
    <Link
      href={`/questions/${call.postId}/`}
      tabIndex={shown ? 0 : -1}
      className="mt-auto line-clamp-1 text-[11px] leading-4"
    >
      {question} →
    </Link>
  </div>
);

const SPARK_W = 212;
const SPARK_H = 44;

// The community forecast from the day the question opened to the event, with
// the lead-up shaded the same way as the band on the main chart
const CallSparkline: FC<{
  call: ChartCall;
  lead: LeadUp;
  thresholdLabel: string;
}> = ({ call, lead, thresholdLabel }) => {
  const n = call.series.length;
  const px = (i: number) => (SPARK_W * i) / Math.max(1, n - 1);
  const py = (v: number) => SPARK_H - 3 - (SPARK_H - 6) * v;
  const path =
    "M" + call.series.map(([, v], i) => `${px(i)} ${py(v)}`).join("L");
  const last = call.series[n - 1]?.[1] ?? 0;
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      className="my-1 block h-auto w-full overflow-visible"
      aria-hidden
    >
      <rect
        x={px(lead.sinceIndex)}
        y={0}
        width={SPARK_W - px(lead.sinceIndex)}
        height={SPARK_H}
        className="fill-olive-400 dark:fill-olive-400-dark"
      />
      <line
        x1={0}
        x2={SPARK_W}
        y1={py(call.threshold)}
        y2={py(call.threshold)}
        strokeDasharray="2 2"
        strokeWidth={1}
        className="stroke-gray-500 dark:stroke-gray-500-dark"
      />
      <text
        x={2}
        y={py(call.threshold) - 3}
        fontSize={9}
        className="fill-gray-600 dark:fill-gray-600-dark"
      >
        {thresholdLabel}
      </text>
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        className="stroke-olive-700 dark:stroke-olive-700-dark"
      />
      <circle
        cx={SPARK_W}
        cy={py(last)}
        r={2.5}
        className="fill-olive-700 dark:fill-olive-700-dark"
      />
    </svg>
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

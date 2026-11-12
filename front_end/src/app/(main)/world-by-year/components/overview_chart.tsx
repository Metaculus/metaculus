"use client";

import { useTranslations } from "next-intl";
import {
  FC,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useId,
  useRef,
} from "react";

import cn from "@/utils/core/cn";

import { YEAR_STEP_KEYS } from "./hero_year_control";
import { KIND_COLOR } from "./milestone_card";
import {
  SETTLE_AFTER_EDGE_KEY_MS,
  SETTLE_AFTER_KEY_MS,
  useWorldYear,
} from "./world_year_provider";
import {
  linearPosition,
  YEAR_MAX,
  YEAR_MIN,
  yearAtLinearPosition,
} from "../helpers/forecast";
import { CHART_HEIGHT, CHART_WIDTH, OVERVIEW_CHART } from "../helpers/overview";

const AXIS_LABELS = [
  { year: 2026, className: "left-0" },
  { year: 2040, className: "left-[56%] -translate-x-1/2" },
  { year: 2050, className: "right-0" },
];

type Props = {
  formatPercent: (share: number) => string;
  settlingClassName: string;
};

const OverviewChart: FC<Props> = ({ formatPercent, settlingClassName }) => {
  const t = useTranslations();
  const { year, settledYear, settleCount, changeYear, changeScrubbing } =
    useWorldYear();
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  const x = linearPosition(year + 1) * CHART_WIDTH;
  const left = `${((x / CHART_WIDTH) * 100).toFixed(2)}%`;
  const capabilityShare = OVERVIEW_CHART.capabilityShare(year);
  const adoptionShare = OVERVIEW_CHART.adoptionShare(year);
  const clipId = `${id}-past`;
  const bandId = `${id}-band`;

  const yearFromPointer = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect?.width) return year;
    return yearAtLinearPosition((clientX - rect.left) / rect.width);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    changeScrubbing(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    changeYear(yearFromPointer(event.clientX));
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) changeYear(yearFromPointer(event.clientX));
  };
  const onPointerEnd = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    changeScrubbing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = YEAR_STEP_KEYS[event.key];
    if (step != null) {
      event.preventDefault();
      changeYear(year + step, SETTLE_AFTER_KEY_MS);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      changeYear(
        event.key === "Home" ? YEAR_MIN : YEAR_MAX,
        SETTLE_AFTER_EDGE_KEY_MS
      );
    }
  };

  const steps = (className: string) => (
    <>
      <path d={OVERVIEW_CHART.bandPath} fill={`url(#${bandId})`} />
      <path
        d={OVERVIEW_CHART.capabilityPath}
        className={cn("fill-none [stroke-linejoin:round]", className)}
        stroke={KIND_COLOR.cap}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={OVERVIEW_CHART.adoptionPath}
        className={cn("fill-none [stroke-linejoin:round]", className)}
        stroke={KIND_COLOR.use}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );

  const axisValueClassName =
    "absolute right-0 bg-[var(--wby-card)] pl-1 text-[11px] text-[var(--wby-dim)]";

  return (
    <figure className="m-0 min-w-[min(300px,100%)] flex-[1_1_400px] rounded-md border border-[var(--wby-line)] bg-[var(--wby-card)] px-[18px] pb-3.5 pt-4">
      <div
        key={`legend-${settleCount}`}
        className={cn(
          "flex flex-wrap gap-x-[22px] gap-y-1.5 text-[15px] text-[var(--wby-t2)]",
          settlingClassName
        )}
      >
        {(
          [
            ["cap", "worldByYearChartCapability"],
            ["use", "worldByYearChartAdoption"],
          ] as const
        ).map(([kind, labelKey]) => (
          <div key={kind} className="flex items-center gap-2">
            <div
              className="h-[2.5px] w-[18px] rounded-sm"
              style={{ background: KIND_COLOR[kind] }}
            />
            {t(labelKey)}
            <span className="tabular-nums text-[var(--wby-fg)]">
              {formatPercent(
                kind === "cap"
                  ? OVERVIEW_CHART.capabilityShare(settledYear)
                  : OVERVIEW_CHART.adoptionShare(settledYear)
              )}
            </span>
          </div>
        ))}
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("worldByYearYear")}
        aria-valuemin={YEAR_MIN}
        aria-valuemax={YEAR_MAX}
        aria-valuenow={year}
        aria-valuetext={t("worldByYearSelectedYearValue", {
          year: String(year),
        })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onLostPointerCapture={onPointerEnd}
        onKeyDown={onKeyDown}
        className="relative mt-6 cursor-ew-resize touch-pan-y select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)]"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden
          className="block h-[180px] w-full overflow-visible"
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={-4} y={-10} width={x + 4} height={200} />
            </clipPath>
            <linearGradient id={bandId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={KIND_COLOR.cap} stopOpacity={0.26} />
              <stop offset="1" stopColor={KIND_COLOR.use} stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT / 2}
            y2={CHART_HEIGHT / 2}
            stroke="var(--wby-line)"
            strokeWidth={1}
            strokeDasharray="3 4"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={0}
            x2={CHART_WIDTH}
            y1={CHART_HEIGHT}
            y2={CHART_HEIGHT}
            stroke="var(--wby-line2)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <g opacity={0.32}>{steps("stroke-[1.75]")}</g>
          <g clipPath={`url(#${clipId})`}>{steps("stroke-[2.5]")}</g>
          <line
            x1={x}
            x2={x}
            y1={0}
            y2={CHART_HEIGHT}
            stroke="var(--wby-year)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {(
          [
            ["cap", capabilityShare],
            ["use", adoptionShare],
          ] as const
        ).map(([kind, share]) => (
          <div
            key={kind}
            className="absolute -ml-[4.5px] -mt-[4.5px] size-[9px] rounded-full"
            style={{
              left,
              top: `${((1 - share) * CHART_HEIGHT).toFixed(1)}px`,
              background: KIND_COLOR[kind],
            }}
          />
        ))}
        <div
          aria-hidden
          className="absolute -top-[9px] z-[6] -ml-[14px] h-[18px] w-7 rounded-full bg-[var(--wby-year)] after:absolute after:inset-0 after:m-auto after:h-[7px] after:w-2 after:bg-[radial-gradient(circle,var(--wby-handle-dot)_0.7px,transparent_1px)] after:bg-[length:4px_3.5px] after:content-['']"
          style={{ left }}
        />
        <div className={cn(axisValueClassName, "-top-[7px]")}>
          {formatPercent(1)}
        </div>
        <div className={cn(axisValueClassName, "top-[83px]")}>
          {formatPercent(0.5)}
        </div>
      </div>
      <div
        key={`axis-${settleCount}`}
        className={cn(
          "relative mt-1.5 h-[14px] text-[11px] text-[var(--wby-dim)]",
          settlingClassName
        )}
      >
        {AXIS_LABELS.map((label) => (
          <span
            key={label.year}
            className={cn("absolute tabular-nums", label.className)}
          >
            {label.year}
          </span>
        ))}
      </div>
      <p
        key={`caption-${settleCount}`}
        className={cn(
          "mb-0 mt-3 text-[13px] leading-[1.5] text-[var(--wby-t3)] [text-wrap:pretty]",
          settlingClassName
        )}
      >
        {t("worldByYearChartCaption")}
      </p>
    </figure>
  );
};

export default OverviewChart;

"use client";

import { useTranslations } from "next-intl";
import {
  FC,
  PointerEvent as ReactPointerEvent,
  UIEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useContainerSize from "@/hooks/use_container_size";
import useMediaQuery from "@/hooks/use_media_query";
import cn from "@/utils/core/cn";

import { KIND_COLOR } from "./milestone_card";
import { useWorldFormatters } from "./use_world_formatters";
import { WorldQuestion } from "../data/questions";
import {
  LANE_END,
  LANE_START,
  laneCenter,
  laneGeometry,
  laneWidth,
  laneX,
  percentileRange,
  quantileBounds,
  todayAsYear,
} from "../helpers/area_section";
import { isLikelyByEndOf, probabilityBy } from "../helpers/forecast";

export type LaneFocus = {
  index: number;
  smooth: boolean;
  fade: boolean;
  id: number;
};

type Props = {
  areaTitle: string;
  statements: WorldQuestion[];
  laneLabels: string[];
  focus: LaneFocus;
  year: number;
  settledYear: number;
  scrubbing: boolean;
  dimClassName: string;
  settleGroup?: string;
  onSelect: (index: number) => void;
};

const AXIS_Y = 14;
const DOT_GAP_RANGE_PX = 20;
const DOT_GAP_RADIUS = 7.5;
const HOVERED_DOT_GAP_RADIUS = 9.75;
const DOT_MASK_HALF = 24;
const DRAG_START_PX = 4;
const EDGE_GAP = 16;

// Linear interpolation through sorted breakpoints.
const interpolate = (value: number, from: number[], to: number[]) => {
  const n = from.length;
  const first = from[0] as number;
  const last = from[n - 1] as number;
  if (value <= first) return to[0] as number;
  if (value >= last) return to[n - 1] as number;
  let i = 0;
  while (i < n - 2 && (from[i + 1] as number) < value) i++;
  const a = from[i] as number;
  const b = from[i + 1] as number;
  const ya = to[i] as number;
  const yb = to[i + 1] as number;
  return a === b ? ya : ya + ((yb - ya) * (value - a)) / (b - a);
};

const SwimlaneChart: FC<Props> = ({
  areaTitle,
  statements,
  laneLabels,
  focus,
  year,
  settledYear,
  scrubbing,
  dimClassName,
  settleGroup,
  onSelect,
}) => {
  const t = useTranslations();
  const { formatDate, formatProbability } = useWorldFormatters();
  const compact = useMediaQuery("(max-width: 720px)");
  const g = useMemo(() => laneGeometry(compact), [compact]);
  const width = laneWidth(g);
  const lanesHeight = 16 + statements.length * g.rowHeight;
  const { ref: scrollerRef, height: scrollerHeight } =
    useContainerSize<HTMLDivElement>();
  const lanesRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const expectedLeftRef = useRef<number | null>(null);
  const expectedTopRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const couplingPausedRef = useRef(false);
  const resumeCouplingFrameRef = useRef<number | null>(null);
  const firstFocusRef = useRef(true);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const maskPrefix = useId();
  const [lanesTop, setLanesTop] = useState(0);
  const [grabbing, setGrabbing] = useState(false);
  const [today] = useState(todayAsYear);

  const windowHeight = Math.max(
    96,
    Math.floor(scrollerHeight - g.header - g.axis)
  );
  const svgHeight = Math.max(lanesHeight, windowHeight);
  const medianXs = statements.map((q) => laneX(g, q.median));
  const centers = statements.map((_, j) => laneCenter(g, j));
  const todayX = laneX(g, today);
  const yearX = laneX(g, year + 1);
  const showToday = Math.abs(todayX - yearX) >= 44;

  // Lanes run earliest-first, so the two scroll directions can follow each
  // other: scrolling the lanes pans the timeline to the middle lane's median,
  // and panning moves that lane to the middle. Positions set here are
  // remembered so their own scroll events are not echoed back.
  const couple = (from: "x" | "y") => {
    const scroller = scrollerRef.current;
    const lanes = lanesRef.current;
    if (!scroller || !lanes) return;
    if (from === "y") {
      const target = Math.round(
        Math.max(
          0,
          Math.min(
            scroller.scrollWidth - scroller.clientWidth,
            interpolate(
              lanes.scrollTop + lanes.clientHeight / 2,
              centers,
              medianXs
            ) -
              scroller.clientWidth * 0.45
          )
        )
      );
      expectedLeftRef.current = target;
      if (Math.abs(scroller.scrollLeft - target) >= 1) {
        scroller.scrollLeft = target;
      }
    } else {
      const target = Math.round(
        Math.max(
          0,
          Math.min(
            lanes.scrollHeight - lanes.clientHeight,
            interpolate(
              scroller.scrollLeft + scroller.clientWidth * 0.45,
              medianXs,
              centers
            ) -
              lanes.clientHeight / 2
          )
        )
      );
      expectedTopRef.current = target;
      if (Math.abs(lanes.scrollTop - target) >= 1) lanes.scrollTop = target;
    }
  };

  const coupleRef = useRef(couple);
  useLayoutEffect(() => {
    coupleRef.current = couple;
  });

  const pauseCoupling = useCallback(() => {
    if (resumeCouplingFrameRef.current != null) {
      cancelAnimationFrame(resumeCouplingFrameRef.current);
      resumeCouplingFrameRef.current = null;
    }
    couplingPausedRef.current = true;
    expectedLeftRef.current = null;
    expectedTopRef.current = null;
  }, []);

  const resumeCoupling = useCallback(() => {
    resumeCouplingFrameRef.current = requestAnimationFrame(() => {
      resumeCouplingFrameRef.current = requestAnimationFrame(() => {
        couplingPausedRef.current = false;
        resumeCouplingFrameRef.current = null;
      });
    });
  }, []);

  useLayoutEffect(() => {
    const lanes = lanesRef.current;
    if (!lanes || !scrollerHeight) return;
    const smooth = focus.smooth && !firstFocusRef.current;
    firstFocusRef.current = false;
    if (focus.fade) {
      [plotRef.current, readoutRef.current].forEach((el) =>
        el?.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 200,
          easing: "ease-out",
        })
      );
    }
    const target = Math.max(
      0,
      Math.min(
        lanes.scrollHeight - lanes.clientHeight,
        Math.round(laneCenter(g, focus.index) - lanes.clientHeight / 2)
      )
    );
    if (Math.abs(lanes.scrollTop - target) < 1) {
      coupleRef.current("y");
    } else if (
      smooth &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      lanes.scrollTo({ top: target, behavior: "smooth" });
    } else {
      lanes.scrollTop = target;
      coupleRef.current("y");
    }
  }, [focus, g, scrollerHeight]);

  const onLanesScroll = (event: UIEvent<HTMLDivElement>) => {
    const lanes = event.currentTarget;
    setHovered(null);
    if (!couplingPausedRef.current) {
      const expected = expectedTopRef.current;
      if (!(expected != null && Math.abs(lanes.scrollTop - expected) < 1.5)) {
        expectedTopRef.current = null;
        couple("y");
      }
    }
    if (scrollFrameRef.current != null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      setLanesTop(lanes.scrollTop);
    });
  };

  const onScrollerScroll = (event: UIEvent<HTMLDivElement>) => {
    const scroller = event.currentTarget;
    setHovered(null);
    if (couplingPausedRef.current) return;
    const expected = expectedLeftRef.current;
    if (!(expected != null && Math.abs(scroller.scrollLeft - expected) < 1.5)) {
      expectedLeftRef.current = null;
      couple("x");
    }
  };

  useEffect(
    () => () => {
      if (scrollFrameRef.current != null) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    []
  );

  // Empty chart space drags to scroll with a mouse; touch scrolls natively.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const scroller = scrollerRef.current;
      const lanes = lanesRef.current;
      if (!drag || event.pointerId !== drag.pointerId || !scroller || !lanes) {
        return;
      }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > DRAG_START_PX) {
        drag.moved = true;
        pauseCoupling();
        plotRef.current?.setPointerCapture(event.pointerId);
        setGrabbing(true);
      }
      if (!drag.moved) return;
      event.preventDefault();
      scroller.scrollLeft = drag.left - dx;
      lanes.scrollTop = drag.top - dy;
    };
    const onUp = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      if (!drag.moved) return;
      if (plotRef.current?.hasPointerCapture(event.pointerId)) {
        plotRef.current.releasePointerCapture(event.pointerId);
      }
      setGrabbing(false);
      resumeCoupling();
      if (event.type !== "pointerup") return;
      const swallowClick = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
      };
      plotRef.current?.addEventListener("click", swallowClick, {
        capture: true,
        once: true,
      });
      setTimeout(
        () =>
          plotRef.current?.removeEventListener("click", swallowClick, {
            capture: true,
          }),
        0
      );
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (resumeCouplingFrameRef.current != null) {
        cancelAnimationFrame(resumeCouplingFrameRef.current);
      }
    };
  }, [scrollerRef, pauseCoupling, resumeCoupling]);

  const onPlotPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const lanes = lanesRef.current;
    if (event.pointerType !== "mouse" || event.button || !scroller || !lanes) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: scroller.scrollLeft,
      top: lanes.scrollTop,
      moved: false,
    };
    event.preventDefault();
  };

  const laneFromEvent = (target: EventTarget | null) => {
    const lane =
      target instanceof Element
        ? target.closest<SVGGElement>("[data-lane]")
        : null;
    return lane ? Number(lane.dataset.lane) : null;
  };

  // Keeps labels 16px clear of the edges, past the scroller's fade.
  const clampLabel = (el: SVGTextElement | null, x: number) => {
    if (!el) return;
    const half = el.getComputedTextLength() / 2;
    if (x - half < EDGE_GAP) {
      el.setAttribute("x", String(EDGE_GAP));
      el.setAttribute("text-anchor", "start");
    } else if (x + half > width - 34) {
      el.setAttribute("x", String(width - 34));
      el.setAttribute("text-anchor", "end");
    } else {
      el.setAttribute("x", x.toFixed(1));
      el.setAttribute("text-anchor", "middle");
    }
  };

  const shownIndex = hovered ?? focus.index;
  const shown = statements[shownIndex];
  const kindLabel = (q: WorldQuestion) =>
    t(q.kind === "cap" ? "worldByYearCapability" : "worldByYearAdoption");

  // A dot closer than 6px to the previous one is nudged so a sliver shows.
  const axisDotXs = medianXs.reduce<number[]>((xs, x) => {
    const previous = xs[xs.length - 1];
    return [...xs, previous != null && x - previous < 6 ? previous + 6 : x];
  }, []);
  // Dots stand in for lanes scrolled out of the window.
  const dotVisible = centers.map(
    (center) => center < lanesTop + 6 || center > lanesTop + windowHeight - 6
  );
  // The dot in front (the earlier lane, or the hovered one) cuts a gap ring
  // out of the overlapping dots behind it, so they read as separate.
  const dotRank = (j: number) => (j === hovered ? Infinity : -j);
  const dotCutters = axisDotXs.map((x, j) =>
    dotVisible[j]
      ? axisDotXs.flatMap((otherX, k) =>
          k !== j &&
          dotVisible[k] &&
          dotRank(k) > dotRank(j) &&
          Math.abs(otherX - x) < DOT_GAP_RANGE_PX
            ? [k]
            : []
        )
      : []
  );

  const lanesLabel = t("worldByYearLanesLabel", {
    area: areaTitle,
    from: String(LANE_START),
    to: String(LANE_END),
    lanes: statements
      .map((q, j) =>
        t("worldByYearLaneSummary", {
          label: laneLabels[j] ?? "",
          date: formatDate(q.median),
          range: percentileRange(q),
        })
      )
      .join("; "),
  });

  return (
    <div
      data-settle={settleGroup}
      className="relative z-[2] flex min-w-0 flex-col border-l border-[var(--wby-divider)] pb-2 pt-3.5 max-[720px]:h-[320px] max-[720px]:border-l-0 max-[720px]:border-t max-[720px]:pb-3 max-[720px]:pt-2.5"
    >
      <div
        ref={readoutRef}
        aria-live="polite"
        className={cn(
          "grid min-h-[38px] gap-[3px] border-b border-[rgba(var(--wby-ink),.12)] px-6 pb-3 pt-1.5 max-[720px]:px-[18px] max-[720px]:pb-2.5 max-[720px]:pt-1",
          dimClassName
        )}
      >
        {shown && (
          <>
            <b className="flex min-w-0 items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium leading-[1.3] text-[rgba(var(--wby-ink),.94)]">
              <i
                className="size-[7px] shrink-0 rounded-full"
                style={{ background: KIND_COLOR[shown.kind] }}
              />
              <span className="truncate">{t(shown.headlineKey)}</span>
            </b>
            <span className="truncate pl-[15px] text-[11px] leading-[1.3] text-[rgba(var(--wby-ink),.55)]">
              {t("worldByYearLaneReadout", {
                kind: kindLabel(shown),
                date: formatDate(shown.median),
                range: percentileRange(shown),
                percent: formatProbability(
                  probabilityBy(settledYear + 1, shown)
                ),
                year: String(settledYear),
              })}
            </span>
          </>
        )}
      </div>
      <div
        ref={scrollerRef}
        onScroll={onScrollerScroll}
        className={cn(
          "relative min-h-0 flex-[1_1_0] cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain no-scrollbar [mask-image:linear-gradient(90deg,transparent,#000_14px,#000_calc(100%-30px),transparent)]",
          grabbing && "cursor-grabbing select-none"
        )}
      >
        {scrollerHeight > 0 && (
          <div
            ref={plotRef}
            onPointerDown={onPlotPointerDown}
            onWheel={(event) => {
              if (!event.deltaX || !event.deltaY) return;
              pauseCoupling();
              resumeCoupling();
            }}
            onPointerOver={(event) => {
              if (scrubbing) return;
              const lane = laneFromEvent(event.target);
              if (lane != null) setHovered(lane);
            }}
            onPointerOut={(event) => {
              const lane = laneFromEvent(event.target);
              if (lane != null && laneFromEvent(event.relatedTarget) !== lane) {
                setHovered(null);
              }
            }}
            onClick={(event) => {
              const lane = laneFromEvent(event.target);
              if (lane != null) onSelect(lane);
            }}
            className="relative"
            style={{ width }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-0"
              style={{ bottom: g.axis - 14 }}
            >
              <i
                className="absolute inset-y-0 left-0 w-0 border-l-[1.25px] border-dashed border-[rgba(var(--wby-ink),.22)]"
                style={{ left: todayX }}
              />
              <i
                className={cn(
                  "absolute inset-y-0 left-0 w-0 border-l-[1.25px] border-[rgba(var(--wby-ink),.32)]",
                  !scrubbing && "transition-transform duration-[180ms] ease-out"
                )}
                style={{ transform: `translateX(${yearX.toFixed(1)}px)` }}
              />
            </div>
            <div className="relative z-[1]" style={{ height: g.header }} />
            <div
              ref={lanesRef}
              onScroll={onLanesScroll}
              className="relative z-[1] overflow-y-auto overflow-x-hidden no-scrollbar [mask-image:linear-gradient(180deg,transparent_0,#000_18px,#000_calc(100%-14px),transparent)]"
              style={{ height: windowHeight }}
            >
              <svg
                role="img"
                aria-label={lanesLabel}
                width={width}
                height={svgHeight}
                viewBox={`0 0 ${width} ${svgHeight}`}
                className="block overflow-visible"
              >
                <g className={dimClassName}>
                  {statements.map((question, j) => {
                    const [low, high] = quantileBounds(question);
                    const x0 = laneX(g, low);
                    const x1 = laneX(g, high);
                    const xm = laneX(g, question.median);
                    const active = j === focus.index;
                    const likely = isLikelyByEndOf(settledYear, question);
                    const color = KIND_COLOR[question.kind];
                    return (
                      <g
                        key={question.id}
                        data-lane={j}
                        transform={`translate(0 ${8 + j * g.rowHeight})`}
                        className={cn(
                          "group/lane cursor-pointer transition-opacity duration-200 ease-[ease]",
                          active
                            ? "opacity-100"
                            : "opacity-50 hover:opacity-[.82]"
                        )}
                      >
                        <rect
                          x={0}
                          y={-3}
                          width={width}
                          height={g.rowHeight}
                          fill="transparent"
                        />
                        <rect
                          x={x0 - 6}
                          y={0}
                          width={x1 - x0 + 12}
                          height={g.rowHeight - 4}
                          fill="transparent"
                        />
                        <text
                          ref={(el) => clampLabel(el, xm)}
                          x={xm}
                          y={13}
                          textAnchor="middle"
                          className={cn(
                            "fill-[rgb(var(--wby-ink))] text-[13px]",
                            active
                              ? "font-medium [fill-opacity:.96]"
                              : "[fill-opacity:.92] group-hover/lane:[fill-opacity:.9]"
                          )}
                        >
                          {laneLabels[j]}
                        </text>
                        <rect
                          x={x0}
                          y={23}
                          width={Math.max(8, x1 - x0)}
                          height={6}
                          rx={3}
                          fill={color}
                          className={cn(
                            "transition-opacity duration-[250ms]",
                            active ? "opacity-[.55]" : "opacity-40"
                          )}
                        />
                        <circle cx={xm} cy={26} r={11} fill="transparent" />
                        <circle
                          cx={xm}
                          cy={26}
                          r={6}
                          fill={likely ? color : "var(--wby-bg)"}
                          stroke={color}
                          strokeWidth={2.5}
                          className="origin-center transition-transform duration-[180ms] ease-[ease] [filter:drop-shadow(0_0_0_var(--wby-bg))_drop-shadow(0_0_1.5px_var(--wby-bg))] [paint-order:stroke] [transform-box:fill-box] group-hover/lane:scale-[1.18]"
                        />
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
            <svg
              aria-hidden
              width={width}
              height={g.axis}
              viewBox={`0 0 ${width} ${g.axis}`}
              className="relative z-[1] block overflow-visible"
            >
              <g className={dimClassName}>
                {Array.from(
                  { length: LANE_END - LANE_START + 1 },
                  (_, i) => LANE_START + i
                ).map((tickYear) => {
                  const x = laneX(g, tickYear);
                  const major = tickYear % 5 === 0 || tickYear === LANE_START;
                  const hidden =
                    Math.abs(x - yearX) < 54 ||
                    (showToday && Math.abs(x - todayX) < 48);
                  return (
                    <g key={tickYear}>
                      <line
                        x1={x}
                        x2={x}
                        y1={AXIS_Y}
                        y2={AXIS_Y + (major ? 6 : 3)}
                        stroke={`rgba(var(--wby-ink),${major ? 0.4 : 0.22})`}
                      />
                      {major && (
                        <text
                          x={x}
                          y={AXIS_Y + 24}
                          textAnchor={
                            tickYear === LANE_START ? "start" : "middle"
                          }
                          className={cn(
                            "fill-[rgb(var(--wby-ink))] text-[11px] tabular-nums transition-opacity duration-150 [fill-opacity:.45]",
                            hidden && "opacity-0"
                          )}
                        >
                          {tickYear}
                        </text>
                      )}
                    </g>
                  );
                })}
                <path
                  d={`M${g.padLeft - 8} ${AXIS_Y} H${width - g.padRight + 22} M${width - g.padRight + 13} ${AXIS_Y - 7} L${width - g.padRight + 22} ${AXIS_Y} L${width - g.padRight + 13} ${AXIS_Y + 7}`}
                  fill="none"
                  stroke="rgba(var(--wby-ink),.28)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x={todayX}
                  y={AXIS_Y + 24}
                  textAnchor="middle"
                  className={cn(
                    "fill-[rgb(var(--wby-ink))] text-[11px] font-medium transition-opacity duration-150 [fill-opacity:.7]",
                    !showToday && "opacity-0"
                  )}
                >
                  {t("worldByYearToday")}
                </text>
              </g>
              <g
                className={cn(
                  !scrubbing && "transition-transform duration-[180ms] ease-out"
                )}
                style={{ transform: `translateX(${yearX.toFixed(1)}px)` }}
              >
                <text
                  x={0}
                  y={AXIS_Y + 24}
                  textAnchor="middle"
                  className="fill-[var(--wby-year)] stroke-[color-mix(in_srgb,var(--wby-bg)_78%,transparent)] text-[11px] font-semibold tabular-nums [paint-order:stroke] [stroke-linejoin:round] [stroke-width:5px]"
                >
                  {year}
                </text>
              </g>
              <defs>
                {dotCutters.map((cutters, j) => {
                  if (!cutters.length) return null;
                  const x = axisDotXs[j] as number;
                  return (
                    <mask
                      key={j}
                      id={`${maskPrefix}-${j}`}
                      maskUnits="userSpaceOnUse"
                      x={x - DOT_MASK_HALF}
                      y={AXIS_Y - DOT_MASK_HALF}
                      width={DOT_MASK_HALF * 2}
                      height={DOT_MASK_HALF * 2}
                    >
                      <rect
                        x={x - DOT_MASK_HALF}
                        y={AXIS_Y - DOT_MASK_HALF}
                        width={DOT_MASK_HALF * 2}
                        height={DOT_MASK_HALF * 2}
                        fill="#fff"
                      />
                      {cutters.map((k) => (
                        <circle
                          key={k}
                          cx={axisDotXs[k]}
                          cy={AXIS_Y}
                          r={
                            k === hovered
                              ? HOVERED_DOT_GAP_RADIUS
                              : DOT_GAP_RADIUS
                          }
                          fill="#000"
                        />
                      ))}
                    </mask>
                  );
                })}
              </defs>
              <g className={dimClassName}>
                {statements
                  .map((question, j) => {
                    const visible = dotVisible[j];
                    const x = axisDotXs[j] as number;
                    const color = KIND_COLOR[question.kind];
                    return (
                      <g
                        key={question.id}
                        data-lane={j}
                        className={cn(
                          "group/dot cursor-pointer transition-opacity duration-200",
                          visible
                            ? "opacity-100"
                            : "pointer-events-none opacity-0"
                        )}
                      >
                        <circle cx={x} cy={AXIS_Y} r={7} fill="transparent" />
                        <circle
                          cx={x}
                          cy={AXIS_Y}
                          r={5}
                          fill={
                            isLikelyByEndOf(settledYear, question)
                              ? color
                              : "var(--wby-bg)"
                          }
                          stroke={color}
                          strokeWidth={1.75}
                          mask={
                            dotCutters[j]?.length
                              ? `url(#${maskPrefix}-${j})`
                              : undefined
                          }
                          className="origin-center transition-transform duration-[180ms] [transform-box:fill-box] group-hover/dot:scale-[1.45]"
                        />
                      </g>
                    );
                  })
                  .reverse()}
              </g>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwimlaneChart;

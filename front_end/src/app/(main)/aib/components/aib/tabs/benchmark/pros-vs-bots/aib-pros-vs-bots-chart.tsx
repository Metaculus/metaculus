"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { FC, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ErrorBar,
  ErrorBarProps,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryErrorBar,
  VictoryLabel,
  VictoryNumberCallback,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { ThemeColor } from "@/types/theme";

import AIBDiffTooltip from "./aib-diff-tooltip";
import { DiffDatum } from "./config";

export type ProsVsBotsDiffSeries = {
  label: string;
  colorToken: ThemeColor;
  data: DiffDatum[];
};

const SINGLE_WIDTH = 102;
const GROUP_WIDTH = 57.5;
const GROUP_OFFSET = 0.16;
const MOBILE_BAR_W = 27.6;
const ERR_CAP = 21;
const ERR_CAP_DOUBLE = 13.8;

type HitDatum = { _x: number; cat: string; y: number };
type VictoryScale = { x: (v: number) => number; y: (v: number) => number };
type InjectedByVictory = {
  datum?: HitDatum;
  scale?: VictoryScale;
  style?: React.CSSProperties;
  events?: React.SVGProps<SVGRectElement>;
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

type VirtualElement = { getBoundingClientRect: () => DOMRect; _rect?: DOMRect };

const AIBProsVsBotsDiffChart: FC<{
  series: ProsVsBotsDiffSeries[];
  className?: string;
}> = ({ series, className }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const chartRef = useRef<HTMLDivElement>(null);
  const { theme, getThemeColor } = useAppTheme();
  const smUp = useBreakpoint("sm");
  const mdUp = useBreakpoint("md");
  const lgUp = useBreakpoint("lg");
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const virtualRef = useRef<VirtualElement | null>(null);
  const { refs, floatingStyles } = useFloating<VirtualElement>({
    placement: "top",
    middleware: [offset(12), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });
  useLayoutEffect(() => {
    if (!anchor || !chartRef.current) return;
    const svg = chartRef.current.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;

    const pt = svg.createSVGPoint();
    pt.x = anchor.x;
    pt.y = anchor.y;

    const ctm = svg.getScreenCTM?.() ?? svg.getCTM?.();
    if (!ctm) return;

    const screen = pt.matrixTransform(ctm);
    const left = screen.x;
    const top = screen.y;

    const prev = virtualRef.current?._rect;
    if (!prev || prev.left !== left || prev.top !== top) {
      const domRect = new DOMRect(left, top, 0, 0);
      const ve: VirtualElement = {
        getBoundingClientRect: () => domRect,
        _rect: domRect,
      };
      virtualRef.current = ve;
      refs.setReference(ve);
    }
  }, [anchor, refs]);

  const s1 = series?.[0];
  const s2 = series?.[1];

  const factor1 = mdUp ? (lgUp ? 1 : 0.8) : 0.55;
  const factor2 = mdUp ? (lgUp ? 1 : 0.6) : 0.4;

  const widthFor =
    (otherHas: Set<string>): VictoryNumberCallback =>
    ({ datum }) => {
      if (!smUp) return MOBILE_BAR_W;
      const cat = (datum as { cat?: string } | undefined)?.cat ?? "";
      return otherHas.has(cat) ? GROUP_WIDTH * factor2 : SINGLE_WIDTH * factor1;
    };

  const safe = (d?: DiffDatum[]) =>
    (d ?? []).filter(
      (p) =>
        typeof p?.x === "string" &&
        Number.isFinite(p?.mean) &&
        Number.isFinite(p?.lo) &&
        Number.isFinite(p?.hi)
    );

  const s1Data = useMemo(() => safe(s1?.data), [s1?.data]);
  const s2Data = useMemo(() => safe(s2?.data), [s2?.data]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const d of [...s1Data, ...s2Data]) {
      if (!seen.has(d.x)) {
        seen.add(d.x);
        out.push(d.x);
      }
    }
    return out;
  }, [s1Data, s2Data]);

  const posByX = useMemo(() => {
    const m = new Map<string, number>();
    categories.forEach((c, i) => m.set(c, i));
    return m;
  }, [categories]);

  const hasS1 = s1Data.length > 0;
  const hasS2 = s2Data.length > 0;

  const xDomain: [number, number] = useMemo(
    () => [-0.5, categories.length - 0.5],
    [categories.length]
  );

  const s1X = useMemo(() => new Set(s1Data.map((d) => d.x)), [s1Data]);
  const s2X = useMemo(() => new Set(s2Data.map((d) => d.x)), [s2Data]);

  const s1OffsetFor = (x: string) =>
    s2X.has(x) ? -(smUp ? GROUP_OFFSET : GROUP_OFFSET * 1.5) : 0;
  const s2OffsetFor = (x: string) =>
    s1X.has(x) ? (smUp ? GROUP_OFFSET : GROUP_OFFSET * 1.5) : 0;

  const s1Bars = s1Data.map((d) => ({
    cat: d.x,
    _x: (posByX.get(d.x) ?? 0) + s1OffsetFor(d.x),
    y: d.mean,
  }));
  const s1Errs = s1Data.map((d) => {
    return {
      cat: d.x,
      _x: (posByX.get(d.x) ?? 0) + s1OffsetFor(d.x),
      y: d.mean,
      errorY: [Math.max(0, d.mean - d.lo), Math.max(0, d.hi - d.mean)] as [
        number,
        number,
      ],
      capW: !lgUp ? ERR_CAP_DOUBLE : ERR_CAP,
    };
  });
  const s2Bars = s2Data.map((d) => ({
    cat: d.x,
    _x: (posByX.get(d.x) ?? 0) + s2OffsetFor(d.x),
    y: d.mean,
  }));
  const s2Errs = s2Data.map((d) => {
    return {
      cat: d.x,
      _x: (posByX.get(d.x) ?? 0) + s2OffsetFor(d.x),
      y: d.mean,
      errorY: [Math.max(0, d.mean - d.lo), Math.max(0, d.hi - d.mean)] as [
        number,
        number,
      ],
      capW: !lgUp ? ERR_CAP_DOUBLE : ERR_CAP,
    };
  });

  const yAbsMax = useMemo(() => {
    let m = 0;
    for (const d of [...s1Data, ...s2Data]) {
      if (Number.isFinite(d.hi)) m = Math.max(m, d.hi);
      if (Number.isFinite(d.mean)) m = Math.max(m, d.mean);
    }
    return m;
  }, [s1Data, s2Data]);

  const { max: yTop, ticks: yTicks } = useMemo(
    () => fixedFiveScale(yAbsMax, 5, 2),
    [yAbsMax]
  );
  const yTicksNoZero = useMemo(() => yTicks.filter((t) => t !== 0), [yTicks]);

  const gridStroke = getThemeColor(METAC_COLORS.gray[400]);
  const axisLabelColor = getThemeColor(METAC_COLORS.gray[700]);
  const tickLabelColor = getThemeColor(METAC_COLORS.gray[500]);
  const show = categories.length > 0 && (hasS1 || hasS2);

  const paddingLeft = smUp ? 64 : 50;
  const paddingRight = 0;
  const paddingTop = 16;
  const paddingBottom = 44;
  const chartH = 360;

  const plotW = Math.max(0, width - paddingLeft - paddingRight);
  const domainSpan = xDomain[1] - xDomain[0];
  const pxPerX = domainSpan > 0 ? plotW / domainSpan : 0;

  const groupOffsetPx =
    pxPerX * (2 * (smUp ? GROUP_OFFSET : GROUP_OFFSET * 1.5));
  const barWidthPxFor = (otherHas: Set<string>) => (cat: string) => {
    if (!smUp) return MOBILE_BAR_W;
    return otherHas.has(cat) ? GROUP_WIDTH * factor2 : SINGLE_WIDTH * factor1;
  };
  const cellWidth = categories.length > 0 ? plotW / categories.length : 0;

  const hitWidthPxFor = (cat: string) => {
    const w1 = barWidthPxFor(s2X)(cat);
    const w2 = barWidthPxFor(s1X)(cat);
    const both = s1X.has(cat) && s2X.has(cat);

    const largestCap = Math.max(
      ...[...s1Errs, ...s2Errs]
        .filter((e) => e.cat === cat)
        .map((e) => e.capW ?? ERR_CAP),
      ERR_CAP
    );
    const capMargin = largestCap + 6;

    const core = both ? Math.max(w1, w2) * 2 + groupOffsetPx : Math.max(w1, w2);
    return Math.max(core + capMargin, Math.max(0, cellWidth - 2));
  };

  const catCenterX = (i: number) =>
    paddingLeft + ((i + 0.5) / Math.max(1, categories.length)) * plotW;

  const getPointerClientY = (evt: React.SyntheticEvent) => {
    const ne = evt.nativeEvent as unknown;
    if (
      typeof ne === "object" &&
      ne !== null &&
      "touches" in (ne as TouchEvent) &&
      (ne as TouchEvent).touches.length > 0
    ) {
      return (ne as TouchEvent).touches[0]?.clientY;
    }
    if (
      typeof ne === "object" &&
      ne !== null &&
      "clientY" in (ne as MouseEvent)
    ) {
      return (ne as MouseEvent).clientY;
    }
    return null;
  };

  return (
    <div ref={ref} className={className ?? "relative w-full"}>
      {show && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 antialiased sm:gap-x-10">
          {s1 && (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-[14px] w-[14px] rounded-[2px]"
                style={{ background: getThemeColor(s1.colorToken) }}
              />
              <span className="text-base text-gray-900 dark:text-gray-900-dark sm:text-lg">
                {s1.label}
              </span>
            </span>
          )}
          {s2 && (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-[14px] w-[14px] rounded-[2px]"
                style={{ background: getThemeColor(s2.colorToken) }}
              />
              <span className="text-base text-gray-900 dark:text-gray-900-dark sm:text-lg">
                {s2.label}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-2 text-base text-gray-700 dark:text-gray-700-dark sm:text-lg">
            <svg
              width="13"
              height="16"
              viewBox="0 0 13 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                y1="1.83398"
                x2="13"
                y2="1.83398"
                stroke="#91999E"
                strokeWidth="2"
              />
              <path
                d="M6.5 15.0391L6.5 2.03906"
                stroke="#91999E"
                strokeWidth="2"
              />
              <line
                y1="14.959"
                x2="13"
                y2="14.959"
                stroke="#91999E"
                strokeWidth="2"
              />
            </svg>
            95% CI
          </span>
        </div>
      )}

      {!show && <div style={{ height: chartH }} />}

      {show && (
        <>
          {width === 0 && <div style={{ height: smUp ? chartH : 240 }} />}
          <div ref={chartRef}>
            {width > 0 && (
              <VictoryChart
                theme={chartTheme}
                width={width}
                height={chartH}
                domain={{ x: xDomain, y: [0, yTop] }}
                domainPadding={{ x: smUp ? 24 : 0 }}
                padding={{
                  top: paddingTop,
                  bottom: paddingBottom,
                  left: paddingLeft,
                  right: paddingRight,
                }}
              >
                <VictoryAxis
                  dependentAxis
                  orientation="left"
                  offsetX={smUp ? 60 : 45}
                  axisLabelComponent={
                    <VictoryLabel angle={-90} dx={-16} dy={smUp ? -10 : -5} />
                  }
                  tickValues={yTicksNoZero}
                  label={smUp ? "Average score difference" : "Score"}
                  style={{
                    grid: {
                      stroke: gridStroke,
                      strokeWidth: 1,
                      strokeDasharray: "2,5",
                    },
                    axis: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: tickLabelColor, fontSize: 16 },
                    axisLabel: { fill: axisLabelColor, fontSize: 16 },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  orientation="left"
                  offsetX={smUp ? 60 : 45}
                  tickValues={[0]}
                  style={{
                    grid: { stroke: gridStroke, strokeWidth: 1 },
                    axis: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: tickLabelColor, fontSize: 16 },
                  }}
                />
                <VictoryAxis
                  tickValues={categories.map((_, i) => i)}
                  tickFormat={(i: number) => categories[i] ?? ""}
                  tickLabelComponent={
                    <VictoryLabel dy={24} textAnchor="middle" />
                  }
                  style={{
                    grid: { stroke: "transparent" },
                    axis: { stroke: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: {
                      fill: tickLabelColor,
                      fontSize: smUp ? 16 : 12,
                    },
                  }}
                />

                {s1Bars.length > 0 && s1?.colorToken && (
                  <VictoryBar
                    data={s1Bars}
                    name="s1Bars"
                    x="_x"
                    y="y"
                    y0={0}
                    barWidth={widthFor(s2X)}
                    alignment="middle"
                    style={{
                      data: {
                        fill: getThemeColor(s1.colorToken),
                        fillOpacity: ({ datum }) =>
                          (datum as HitDatum).cat === activeCat ? 0.5 : 0.3,
                        stroke: "none",
                        pointerEvents: "none",
                      },
                    }}
                  />
                )}

                {s1Bars.length > 0 && s1?.colorToken && (
                  <VictoryErrorBar
                    data={s1Errs}
                    x="_x"
                    y="y"
                    name="s1Errs"
                    errorY={(d: { errorY: [number, number] }) => d.errorY}
                    errorX={0}
                    groupComponent={<g pointerEvents="none" />}
                    dataComponent={
                      <NonInteractiveErrorBar
                        style={{
                          stroke: getThemeColor(s1.colorToken),
                          strokeWidth: 2,
                          pointerEvents: "none",
                        }}
                      />
                    }
                    style={{
                      data: {
                        stroke: getThemeColor(s1.colorToken),
                        strokeWidth: 2,
                      },
                    }}
                  />
                )}

                {s2Bars.length > 0 && s2?.colorToken && (
                  <VictoryBar
                    data={s2Bars}
                    x="_x"
                    y="y"
                    y0={0}
                    name="s2Bars"
                    barWidth={widthFor(s1X)}
                    alignment="middle"
                    style={{
                      data: {
                        fill: getThemeColor(s2.colorToken),
                        fillOpacity: ({ datum }) =>
                          (datum as HitDatum).cat === activeCat ? 0.5 : 0.3,
                        stroke: "none",
                        pointerEvents: "none",
                      },
                    }}
                  />
                )}

                {s2Bars.length > 0 && s2?.colorToken && (
                  <VictoryErrorBar
                    data={s2Errs}
                    x="_x"
                    y="y"
                    name="s2Errs"
                    groupComponent={<g pointerEvents="none" />}
                    dataComponent={
                      <NonInteractiveErrorBar
                        style={{
                          stroke: getThemeColor(s2.colorToken),
                          strokeWidth: 2,
                          pointerEvents: "none",
                        }}
                      />
                    }
                    style={{
                      data: {
                        stroke: getThemeColor(s2.colorToken),
                        strokeWidth: 2,
                        pointerEvents: "none",
                      },
                    }}
                    errorY={(d: { errorY: [number, number] }) => d.errorY}
                    errorX={0}
                  />
                )}

                <VictoryBar
                  name="hitStrips"
                  data={categories.map((c, i) => ({ _x: i, cat: c, y: 1 }))}
                  x="_x"
                  y="y"
                  dataComponent={
                    <FullHeightCell
                      plotTop={paddingTop}
                      plotBottom={chartH - paddingBottom}
                      getWidth={(cat: string) => hitWidthPxFor(cat)}
                    />
                  }
                  style={{ data: { pointerEvents: "all" } }}
                  events={[
                    {
                      target: "data",
                      eventHandlers: {
                        onMouseMove: (evt, props) => {
                          const d = (props as { datum?: HitDatum }).datum;
                          if (!d) return undefined;

                          const svg = chartRef.current?.querySelector("svg");
                          if (!svg) return undefined;

                          const rect = svg.getBoundingClientRect();
                          const clientY = getPointerClientY(evt);
                          if (clientY == null) return undefined;

                          const y = clamp(
                            clientY - rect.top,
                            paddingTop,
                            chartH - paddingBottom
                          );
                          setActiveCat(d.cat);
                          setAnchor({ x: catCenterX(d._x), y });
                          return undefined;
                        },
                        onMouseLeave: () => {
                          setActiveCat(null);
                          setAnchor(null);
                          return undefined;
                        },
                        onTouchStart: (evt, props) => {
                          const d = (props as { datum?: HitDatum }).datum;
                          if (!d) return undefined;

                          const svg = chartRef.current?.querySelector("svg");
                          if (!svg) return undefined;

                          const rect = svg.getBoundingClientRect();
                          const clientY = getPointerClientY(evt);
                          const y = clamp(
                            (clientY ?? rect.top) - rect.top,
                            paddingTop,
                            chartH - paddingBottom
                          );
                          setActiveCat(d.cat);
                          setAnchor({ x: catCenterX(d._x), y });
                          return undefined;
                        },
                        onTouchMove: (evt, props) => {
                          const d = (props as { datum?: HitDatum }).datum;
                          if (!d) return undefined;

                          const svg = chartRef.current?.querySelector("svg");
                          if (!svg) return undefined;

                          const rect = svg.getBoundingClientRect();
                          const clientY = getPointerClientY(evt);
                          if (clientY == null) return undefined;

                          const y = clamp(
                            clientY - rect.top,
                            paddingTop,
                            chartH - paddingBottom
                          );
                          setAnchor({ x: catCenterX(d._x), y });
                          return undefined;
                        },
                        onTouchEnd: () => {
                          setActiveCat(null);
                          setAnchor(null);
                          return undefined;
                        },
                      },
                    },
                  ]}
                />
              </VictoryChart>
            )}
          </div>

          {activeCat && anchor && (
            <FloatingPortal>
              <div
                ref={refs.setFloating}
                style={{ ...floatingStyles, pointerEvents: "none" }}
                className="z-[100]"
              >
                <AIBDiffTooltip
                  quarter={activeCat}
                  rows={[
                    ...(s1
                      ? [
                          {
                            label: "Binary",
                            color: getThemeColor(s1.colorToken),
                            mean:
                              s1Data.find((d) => d.x === activeCat)?.mean ?? 0,
                            lo: s1Data.find((d) => d.x === activeCat)?.lo ?? 0,
                            hi: s1Data.find((d) => d.x === activeCat)?.hi ?? 0,
                          },
                        ]
                      : []),
                    ...(s2
                      ? [
                          {
                            label: "All questions",
                            color: getThemeColor(s2.colorToken),
                            mean:
                              s2Data.find((d) => d.x === activeCat)?.mean ?? 0,
                            lo: s2Data.find((d) => d.x === activeCat)?.lo ?? 0,
                            hi: s2Data.find((d) => d.x === activeCat)?.hi ?? 0,
                          },
                        ]
                      : []),
                  ]}
                  rightTitle="Avg Scores"
                />
              </div>
            </FloatingPortal>
          )}
        </>
      )}
    </div>
  );
};

const CapWidthErrorBar: React.FC<ErrorBarProps> = (props) => {
  const capW = props.datum?.capW ?? ERR_CAP;
  return <ErrorBar {...props} borderWidth={capW} />;
};

const fixedFiveScale = (max: number, step = 5, pad = 2) => {
  if (!Number.isFinite(max) || max <= 0) return { max: step, ticks: [0, step] };
  const top = Math.ceil((max + pad) / step) * step;
  const ticks = Array.from(
    { length: Math.floor(top / step) + 1 },
    (_, i) => i * step
  );
  return { max: top, ticks };
};

const NonInteractiveErrorBar: React.FC<ErrorBarProps> = (props) => (
  <g pointerEvents="none">
    <CapWidthErrorBar {...props} />
  </g>
);

type FullCellProps = InjectedByVictory & {
  plotTop: number;
  plotBottom: number;
  getWidth: (cat: string) => number;
};

const FullHeightCell: React.FC<FullCellProps> = (props) => {
  const { datum, scale, plotTop, plotBottom, getWidth, style, events } = props;
  if (!datum || !scale) return null;

  const xCenter = scale.x(datum._x);
  const w = getWidth(datum.cat);
  const h = Math.max(0, plotBottom - plotTop);

  return (
    <rect
      x={xCenter - w / 2}
      y={plotTop}
      width={w}
      height={h}
      fill="#000"
      fillOpacity={0.001}
      style={{ pointerEvents: "all", ...style }}
      {...events}
    />
  );
};

export default AIBProsVsBotsDiffChart;

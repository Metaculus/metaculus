"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import {
  FC,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ErrorBar,
  ErrorBarProps,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryErrorBar,
  VictoryLabel,
  VictoryNumberCallback,
  VictoryScatter,
  VictoryVoronoiContainer,
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
const ERR_CAP = 21;
const ERR_CAP_DOUBLE = Math.round(ERR_CAP * 0.53);

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
    const double = s2X.has(d.x);
    return {
      cat: d.x,
      _x: (posByX.get(d.x) ?? 0) + s1OffsetFor(d.x),
      y: d.mean,
      errorY: [Math.max(0, d.mean - d.lo), Math.max(0, d.hi - d.mean)] as [
        number,
        number,
      ],
      capW: !lgUp && double ? ERR_CAP_DOUBLE : ERR_CAP,
    };
  });
  const s2Bars = s2Data.map((d) => ({
    cat: d.x,
    _x: (posByX.get(d.x) ?? 0) + s2OffsetFor(d.x),
    y: d.mean,
  }));
  const s2Errs = s2Data.map((d) => {
    const double = s1X.has(d.x);
    return {
      cat: d.x,
      _x: (posByX.get(d.x) ?? 0) + s2OffsetFor(d.x),
      y: d.mean,
      errorY: [Math.max(0, d.mean - d.lo), Math.max(0, d.hi - d.mean)] as [
        number,
        number,
      ],
      capW: !lgUp && double ? ERR_CAP_DOUBLE : ERR_CAP,
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

      {!show && <div style={{ height: 360 }} />}

      {show && (
        <>
          {width === 0 && <div style={{ height: smUp ? 360 : 240 }} />}
          <div ref={chartRef}>
            {width > 0 && (
              <VictoryChart
                theme={chartTheme}
                width={width}
                height={360}
                domain={{ x: xDomain, y: [0, yTop] }}
                domainPadding={{ x: smUp ? 24 : 0 }}
                padding={{
                  top: 16,
                  bottom: 44,
                  left: smUp ? 64 : 50,
                  right: 0,
                }}
                containerComponent={
                  <VictoryVoronoiContainer
                    voronoiDimension="x"
                    voronoiBlacklist={["s1Bars", "s1Errs", "s2Bars", "s2Errs"]}
                    labels={() => " "}
                    labelComponent={
                      <HoverProbe
                        onMove={({ x, y, datum }) => {
                          const c = datum?.cat ?? null;
                          setActiveCat(c);
                          setAnchor({ x, y });
                        }}
                      />
                    }
                    style={{ touchAction: "pan-y" }}
                  />
                }
                events={[
                  {
                    target: "parent",
                    eventHandlers: {
                      onMouseLeave: () => {
                        setActiveCat(null);
                        setAnchor(null);
                      },
                      onTouchEnd: () => {
                        setActiveCat(null);
                        setAnchor(null);
                      },
                    },
                  },
                ]}
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
                    tickLabels: {
                      fill: tickLabelColor,
                      fontSize: 16,
                    },
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
                    tickLabels: {
                      fill: tickLabelColor,
                      fontSize: 16,
                    },
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

                <VictoryScatter
                  name="hoverCenters"
                  data={categories.map((c, i) => {
                    const mean =
                      s1Data.find((d) => d.x === c)?.mean ??
                      s2Data.find((d) => d.x === c)?.mean ??
                      0;
                    return { x: i, y: mean, cat: c };
                  })}
                  size={14}
                  style={{ data: { opacity: 0 } }}
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
                          datum.cat === activeCat ? 0.5 : 0.3,
                        stroke: "none",
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
                    dataComponent={
                      <CapWidthErrorBar
                        style={{
                          stroke: getThemeColor(s1.colorToken),
                          strokeWidth: 2,
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
                          datum.cat === activeCat ? 0.5 : 0.3,
                        stroke: "none",
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
                    dataComponent={
                      <CapWidthErrorBar
                        style={{
                          stroke: getThemeColor(s2.colorToken),
                          strokeWidth: 2,
                        }}
                      />
                    }
                    errorY={(d: { errorY: [number, number] }) => d.errorY}
                    errorX={0}
                    style={{
                      data: {
                        stroke: getThemeColor(s2.colorToken),
                        strokeWidth: 2,
                      },
                    }}
                  />
                )}
              </VictoryChart>
            )}
          </div>

          {activeCat && anchor && (
            <FloatingPortal>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
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

type VirtualElement = { getBoundingClientRect: () => DOMRect; _rect?: DOMRect };
const hasCat = (d: unknown): d is { cat?: string } =>
  typeof (d as { cat?: unknown })?.cat === "string";
const EPS = 0.5;
type HoverMove = { x: number; y: number; datum: { cat?: string } };
const HoverProbe: React.FC<
  import("victory").VictoryLabelProps & { onMove: (p: HoverMove) => void }
> = ({ x, y, datum, onMove }) => {
  const last = useRef<{ x: number; y: number; cat?: string } | null>(null);
  useEffect(() => {
    if (typeof x !== "number" || typeof y !== "number") return;
    const cat = hasCat(datum) ? (datum.cat as string) : undefined;
    const prev = last.current;
    if (
      !prev ||
      Math.abs(prev.x - x) > EPS ||
      Math.abs(prev.y - y) > EPS ||
      prev.cat !== cat
    ) {
      last.current = { x, y, cat };
      onMove({ x, y, datum: { cat } });
    }
  }, [x, y, datum, onMove]);
  return null;
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

export default AIBProsVsBotsDiffChart;

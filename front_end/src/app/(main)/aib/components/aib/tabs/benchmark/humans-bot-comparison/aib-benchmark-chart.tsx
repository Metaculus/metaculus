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
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryScatter,
  VictoryVoronoiContainer,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

import AIBBenchmarkTooltip, { BenchmarkRow } from "./aib-benchmark-tooltip";
import {
  AIB_THEME,
  BenchmarkPoint as Row,
  SERIES_META,
  SeriesKey,
} from "./config";

type Props = { data: Row[]; className?: string };

const AIBBenchmarkChart: FC<Props> = ({ data, className }) => {
  const { ref: wrapRef, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const [activeX, setActiveX] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const lastState = useRef<{
    x: string | null;
    ax?: number;
    ay?: number;
  } | null>(null);

  const virtualRef = useRef<VirtualElement | null>(null);
  const { refs, floatingStyles } = useFloating<VirtualElement>({
    placement: "top",
    middleware: [offset(12), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    if (!activeX || !anchor || !wrapRef.current) return;
    const svg = wrapRef.current.querySelector("svg");
    if (!(svg instanceof SVGSVGElement)) return;

    const rect = svg.getBoundingClientRect();
    const left = rect.left + anchor.x;
    const top = rect.top + anchor.y;

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
  }, [activeX, anchor, refs, wrapRef]);

  const colorOf = (series: SeriesKey): string =>
    getThemeColor(AIB_THEME[SERIES_META[series].theme].token);

  const { yDomain, ticks } = useMemo(() => {
    const values = data.flatMap((d) => [d.baseline, d.pros, d.bots]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const pad = Math.max(0.5, range * 0.1);
    const lo = Math.floor(min - pad);
    const hi = Math.ceil(max + pad);
    const step = (hi - lo) / (GRIDLINES - 1);
    const t = Array.from({ length: GRIDLINES }, (_, i) =>
      Number((lo + i * step).toFixed(6))
    );
    return { yDomain: [lo, hi] as [number, number], ticks: t };
  }, [data]);

  const smUp = useBreakpoint("sm");

  const rowByX: Record<string, BenchmarkRow> = useMemo(
    () =>
      Object.fromEntries(
        data.map((d) => [
          d.x,
          {
            x: d.x,
            baseline: d.baseline,
            pros: d.pros,
            bots: d.bots,
          } as BenchmarkRow,
        ])
      ),
    [data]
  );

  const lineStyle = (series: SeriesKey) => ({
    data: { stroke: colorOf(series), strokeWidth: 1.5 },
  });

  return (
    <div ref={wrapRef} className={className ?? "relative w-full"}>
      <div className="mb-4 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 antialiased sm:mb-9 sm:gap-6">
        {SERIES_SPECS.map(({ key, label }) => (
          <div key={key} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-[14px] w-[14px] rounded-[2px]"
              style={{ background: colorOf(key) }}
            />
            <span className="text-base font-[400] text-gray-900 dark:text-gray-900-dark sm:text-lg">
              {label}
            </span>
          </div>
        ))}
      </div>

      {width === 0 && <div style={{ height: smUp ? 360 : 200 }} />}
      {width > 0 && (
        <VictoryChart
          width={width}
          height={smUp ? 360 : 200}
          theme={chartTheme}
          domain={{ y: yDomain }}
          domainPadding={{ x: 20 }}
          padding={{ top: 16, bottom: 28 }}
          categories={{ x: data.map((d) => d.x) }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              voronoiBlacklist={SERIES_SPECS.map((s) => `${s.name}-line`)}
              activateData
              labels={() => " "}
              labelComponent={
                <HoverProbe
                  onMove={({ x, y, datum }) => {
                    const q = String(datum?.x ?? "");
                    const prev = lastState.current;
                    if (
                      !prev ||
                      prev.x !== q ||
                      prev.ax !== x ||
                      prev.ay !== y
                    ) {
                      lastState.current = { x: q, ax: x, ay: y };
                      setActiveX(q);
                      setAnchor({ x, y });
                    }
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
                  setActiveX(null);
                  setAnchor(null);
                },
              },
            },
          ]}
        >
          {activeX && (
            <VictoryLine
              data={[
                { x: activeX, y: yDomain[0] },
                { x: activeX, y: yDomain[1] },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.gray[400]),
                  strokeWidth: 2,
                  strokeDasharray: "5 3",
                  opacity: 0.9,
                },
              }}
            />
          )}
          <VictoryAxis
            dependentAxis
            tickValues={ticks}
            axisLabelComponent={<VictoryLabel dy={-28} />}
            style={{
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray[400]),
                strokeWidth: 1,
                strokeDasharray: "2,5",
              },
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: { fill: "transparent" },
              axisLabel: { fill: "transparent" },
            }}
          />
          <VictoryAxis
            tickValues={data.map((d) => d.x)}
            tickFormat={(v: string | number) => String(v)}
            tickLabelComponent={<EdgeNudgedTickLabel dy={6} />}
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[600]),
                fontSize: smUp ? 16 : 12,
              },
              grid: { stroke: "transparent" },
            }}
          />
          <VictoryLine
            name="baselineLine"
            data={data.map((d) => ({ x: d.x, y: d.baseline }))}
            style={lineStyle("baseline")}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.baseline }))}
            symbol="square"
            size={9}
            style={{
              parent: { pointerEvents: "none" },
              data: {
                fill: colorOf("baseline"),
                opacity: ({ datum }) => (datum.x === activeX ? 0.18 : 0),
              },
            }}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.baseline }))}
            symbol="square"
            size={4}
            style={{ data: { fill: colorOf("baseline") } }}
          />{" "}
          <VictoryLine
            name="prosLine"
            data={data.map((d) => ({ x: d.x, y: d.pros }))}
            style={lineStyle("pros")}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.pros }))}
            symbol="square"
            size={9}
            style={{
              parent: { pointerEvents: "none" },
              data: {
                fill: colorOf("pros"),
                opacity: ({ datum }) => (datum.x === activeX ? 0.18 : 0),
              },
            }}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.pros }))}
            symbol="square"
            size={4}
            style={{ data: { fill: colorOf("pros") } }}
          />{" "}
          <VictoryLine
            name="botsLine"
            data={data.map((d) => ({ x: d.x, y: d.bots }))}
            style={lineStyle("bots")}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.bots }))}
            symbol="square"
            size={9}
            style={{
              parent: { pointerEvents: "none" },
              data: {
                fill: colorOf("bots"),
                opacity: ({ datum }) => (datum.x === activeX ? 0.18 : 0),
              },
            }}
          />{" "}
          <VictoryScatter
            data={data.map((d) => ({ x: d.x, y: d.bots }))}
            symbol="square"
            size={4}
            style={{ data: { fill: colorOf("bots") } }}
          />
        </VictoryChart>
      )}

      {activeX && anchor && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[100]"
          >
            <AIBBenchmarkTooltip
              quarter={activeX}
              row={
                rowByX[activeX] || { x: activeX, baseline: 0, pros: 0, bots: 0 }
              }
              colors={{
                pros: colorOf("pros"),
                bots: colorOf("bots"),
                baseline: colorOf("baseline"),
              }}
              labels={{ baseline: "Baseline" }}
            />
          </div>
        </FloatingPortal>
      )}
    </div>
  );
};

const SERIES_SPECS = [
  {
    key: "baseline",
    name: "baseline",
    label: "Baseline (Sonnet 3.7)",
  },
  {
    key: "pros",
    name: "pros",
    label: "Pro Forecasters",
  },
  {
    key: "bots",
    name: "bots",
    label: "Bots",
  },
] as const;

const GRIDLINES = 5;
type VirtualElement = {
  getBoundingClientRect: () => DOMRect;
  _rect?: DOMRect;
};

const EdgeNudgedTickLabel: React.FC<
  VictoryLabelProps & { index?: number; ticks?: unknown[] }
> = (props) => {
  const index = props.index ?? 0;
  const tickCount = props.ticks?.length ?? 0;
  const dx =
    index === 0 ? 24 : tickCount > 0 && index === tickCount - 1 ? -24 : 0;
  return <VictoryLabel {...props} dx={dx} />;
};

type HoverMove = { x: number; y: number; datum: { x: string } };
const hasX = (d: unknown): d is { x: string | number } =>
  typeof (d as { x?: unknown })?.x === "string" ||
  typeof (d as { x?: unknown })?.x === "number";
const EPS = 0.5;
const HoverProbe: React.FC<
  VictoryLabelProps & { onMove: (p: HoverMove) => void }
> = ({ x, y, datum, onMove }) => {
  const last = useRef<{ x: number; y: number; q: string } | null>(null);

  useEffect(() => {
    if (typeof x !== "number" || typeof y !== "number" || !hasX(datum)) return;
    const q = String(datum.x);
    const prev = last.current;
    if (
      !prev ||
      Math.abs(prev.x - x) > EPS ||
      Math.abs(prev.y - y) > EPS ||
      prev.q !== q
    ) {
      last.current = { x, y, q };
      onMove({ x, y, datum: { x: q } });
    }
  }, [x, y, datum, onMove]);

  return null;
};

export default AIBBenchmarkChart;

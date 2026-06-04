"use client";

import Link from "next/link";
import { CSSProperties, FC, ReactNode, useState } from "react";

import { addOpacityToHex, shadeHex } from "@/utils/core/colors";

import ConsequenceGauge from "./consequence_gauge";
import { DonkeyIcon, ElephantIcon } from "./party_icons";
import { MIDTERMS_COLORS } from "../constants";
import { useIsDark } from "../helpers/use_is_dark";

type Column = "dem" | "split" | "rep";
type CellCol = "question" | Column;

// Shared column template. The question column is `minmax(0, 5fr)` so it gives
// up space first as the container narrows, while the three scenario columns
// clamp at a min width and stay even. Header and rows share this template (and
// gap-0) so the colored headers line up with the cells below.
const COLS =
  "md:grid-cols-[minmax(0,5fr)_minmax(110px,1fr)_minmax(110px,1fr)_minmax(110px,1fr)]";

export type ConsequenceGridRow = {
  key: string;
  href: string;
  question: string;
  demPct: number | null;
  splitPct: number | null;
  repPct: number | null;
  ifDemLabel: string;
  ifSplitLabel: string;
  ifRepLabel: string;
};

export type ConsequenceHeaderCopy = {
  title: string;
  subtitle: string;
};

type Props = {
  /** Slot for the section title + description. Rendered in column 1 of
   *  the header row so it sits offset from the colored party cards. */
  leadingSlot: ReactNode;
  rows: ConsequenceGridRow[];
  demHeader: ConsequenceHeaderCopy;
  splitHeader: ConsequenceHeaderCopy;
  repHeader: ConsequenceHeaderCopy;
};

// Header card backgrounds. Each color has rest + active variants per
// theme so the column reads as visibly lit when hovered.
const REP_HEADER_BG = {
  light: { rest: MIDTERMS_COLORS.repBorder, active: "#A02B25" },
  dark: { rest: "#B83C32", active: MIDTERMS_COLORS.repBorderDark },
};
const DEM_HEADER_BG = {
  light: { rest: "#1E3A8A", active: "#152A66" },
  dark: { rest: "#4A5FCF", active: MIDTERMS_COLORS.demBorderDark },
};

// Split column blends the Dem (left) and Rep (right) header colors.
const splitGradient = (dem: string, rep: string) =>
  `linear-gradient(to right, ${dem}, ${rep})`;
const SPLIT_HEADER_BG = {
  light: {
    rest: splitGradient(DEM_HEADER_BG.light.rest, REP_HEADER_BG.light.rest),
    active: splitGradient(
      DEM_HEADER_BG.light.active,
      REP_HEADER_BG.light.active
    ),
  },
  dark: {
    rest: splitGradient(DEM_HEADER_BG.dark.rest, REP_HEADER_BG.dark.rest),
    active: splitGradient(DEM_HEADER_BG.dark.active, REP_HEADER_BG.dark.active),
  },
};

// Per-column gauge tint. Split uses a neutral slate (neither party).
const GAUGE_COLOR: Record<Column, { light: string; dark: string }> = {
  dem: {
    light: MIDTERMS_COLORS.demPrimary,
    dark: MIDTERMS_COLORS.demPrimaryDark,
  },
  rep: {
    light: MIDTERMS_COLORS.repPrimary,
    dark: MIDTERMS_COLORS.repPrimaryDark,
  },
  split: { light: "#7D818A", dark: "#94A3B8" },
};

// Hover-highlight tints. The question column uses a neutral slate.
const HL_COLOR: Record<CellCol, { light: string; dark: string }> = {
  question: { light: "#64748B", dark: "#94A3B8" },
  ...GAUGE_COLOR,
};
const HL_SUBTLE = 0.1;
const HL_STRONG = 0.3;

type HoverState =
  | { kind: "cell"; row: string; col: Column }
  | { kind: "row"; row: string }
  | { kind: "col"; col: Column }
  | null;

const ConsequenceGrid: FC<Props> = ({
  leadingSlot,
  rows,
  demHeader,
  splitHeader,
  repHeader,
}) => {
  const isDark = useIsDark();
  const [hover, setHover] = useState<HoverState>(null);

  const repBg = isDark ? REP_HEADER_BG.dark : REP_HEADER_BG.light;
  const demBg = isDark ? DEM_HEADER_BG.dark : DEM_HEADER_BG.light;
  const splitBg = isDark ? SPLIT_HEADER_BG.dark : SPLIT_HEADER_BG.light;
  const tone = (col: Column) =>
    isDark ? GAUGE_COLOR[col].dark : GAUGE_COLOR[col].light;

  // The gauge inside the hovered cell shifts darker (light mode) / lighter
  // (dark mode) so it stands out from the rest of the row + column.
  const gaugeColor = (rowKey: string, col: Column): string => {
    const base = tone(col);
    const active =
      hover?.kind === "cell" && hover.row === rowKey && hover.col === col;
    return active ? shadeHex(base, isDark ? 0.3 : -0.3) : base;
  };

  const activeCol: Column | null =
    hover && (hover.kind === "cell" || hover.kind === "col") ? hover.col : null;

  const tint = (key: CellCol, alpha: number) =>
    addOpacityToHex(isDark ? HL_COLOR[key].dark : HL_COLOR[key].light, alpha);

  // Highlight background for a given cell, given the current hover target:
  // - hovering a question highlights just that row (neutral);
  // - hovering a header highlights that whole column (its color);
  // - hovering a data cell highlights its row + column (its color), with the
  //   intersection (the hovered cell) a touch stronger.
  const cellBg = (rowKey: string, col: CellCol): string | undefined => {
    if (!hover) return undefined;
    if (hover.kind === "row") {
      return hover.row === rowKey ? tint("question", HL_SUBTLE) : undefined;
    }
    if (hover.kind === "col") {
      return col === hover.col ? tint(hover.col, HL_SUBTLE) : undefined;
    }
    const rowMatch = hover.row === rowKey;
    const colMatch = col === hover.col;
    if (rowMatch && colMatch) return tint(hover.col, HL_STRONG);
    if (rowMatch || colMatch) return tint(hover.col, HL_SUBTLE);
    return undefined;
  };

  // The question (leftmost) cell fades its highlight in from the left edge so
  // the row tint doesn't begin with a hard vertical edge.
  const questionBg = (rowKey: string): CSSProperties | undefined => {
    const b = cellBg(rowKey, "question");
    return b
      ? {
          background: `linear-gradient(to right, transparent 0%, ${b} 10%, ${b} 100%)`,
        }
      : undefined;
  };

  return (
    <div onMouseLeave={() => setHover(null)}>
      {/* Header row: lead slot in col 1, party cards in cols 2-4. Same
          template + gap-0 as the rows so cards align with the cells below. */}
      <div className={`hidden md:mb-4 md:grid ${COLS} md:items-end md:gap-0`}>
        <div className="md:pr-4">{leadingSlot}</div>
        <div className="md:px-1">
          <PartyHeader
            background={demBg.rest}
            activeBackground={demBg.active}
            icon={<DonkeyIcon width={26} height={26} className="shrink-0" />}
            title={demHeader.title}
            subtitle={demHeader.subtitle}
            active={activeCol === "dem"}
            onMouseEnter={() => setHover({ kind: "col", col: "dem" })}
          />
        </div>
        <div className="md:px-1">
          <PartyHeader
            background={splitBg.rest}
            activeBackground={splitBg.active}
            icon={
              <span className="flex shrink-0 items-center gap-0.5">
                <DonkeyIcon width={18} height={18} />
                <ElephantIcon width={18} height={18} />
              </span>
            }
            title={splitHeader.title}
            subtitle={splitHeader.subtitle}
            active={activeCol === "split"}
            onMouseEnter={() => setHover({ kind: "col", col: "split" })}
          />
        </div>
        <div className="md:px-1">
          <PartyHeader
            background={repBg.rest}
            activeBackground={repBg.active}
            icon={<ElephantIcon width={26} height={26} className="shrink-0" />}
            title={repHeader.title}
            subtitle={repHeader.subtitle}
            active={activeCol === "rep"}
            onMouseEnter={() => setHover({ kind: "col", col: "rep" })}
          />
        </div>
      </div>

      {/* Mobile-only leading slot (when md grid above is hidden). */}
      <div className="mb-6 md:hidden">{leadingSlot}</div>

      {rows.map((row) => (
        <Link
          key={row.key}
          href={row.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`group/row grid grid-cols-3 border-b border-blue-400 no-underline last:border-0 dark:border-blue-300-dark/60 ${COLS} md:gap-0`}
        >
          {/* Mobile: question spans the full width with the three gauges in a
              row beneath it. Desktop: question is the first column. The title
              underlines on row hover to signal the row is a link. */}
          <p
            onMouseEnter={() => setHover({ kind: "row", row: row.key })}
            style={questionBg(row.key)}
            className="col-span-3 m-0 flex items-center pb-2 pt-4 text-sm font-medium text-blue-800 transition-colors dark:text-blue-800-dark md:col-span-1 md:py-4 md:pr-4 md:text-base"
          >
            <span className="decoration-blue-600 decoration-1 underline-offset-4 group-hover/row:underline dark:decoration-blue-400-dark">
              {row.question}
            </span>
          </p>
          <GaugeCell
            pct={row.demPct}
            color={gaugeColor(row.key, "dem")}
            mobileLabel={row.ifDemLabel}
            bg={cellBg(row.key, "dem")}
            onEnter={() => setHover({ kind: "cell", row: row.key, col: "dem" })}
          />
          <GaugeCell
            pct={row.splitPct}
            color={gaugeColor(row.key, "split")}
            mobileLabel={row.ifSplitLabel}
            bg={cellBg(row.key, "split")}
            onEnter={() =>
              setHover({ kind: "cell", row: row.key, col: "split" })
            }
          />
          <GaugeCell
            pct={row.repPct}
            color={gaugeColor(row.key, "rep")}
            mobileLabel={row.ifRepLabel}
            bg={cellBg(row.key, "rep")}
            onEnter={() => setHover({ kind: "cell", row: row.key, col: "rep" })}
          />
        </Link>
      ))}
    </div>
  );
};

export default ConsequenceGrid;

type PartyHeaderProps = {
  background: string;
  activeBackground: string;
  icon: ReactNode;
  /** Used as the accessible label; not rendered visually. */
  title: string;
  subtitle: string;
  active: boolean;
  onMouseEnter: () => void;
};

const PartyHeader: FC<PartyHeaderProps> = ({
  background,
  activeBackground,
  icon,
  title,
  subtitle,
  active,
  onMouseEnter,
}) => {
  return (
    <div
      aria-label={title}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-white transition-[background] duration-150"
      style={{ background: active ? activeBackground : background }}
      onMouseEnter={onMouseEnter}
    >
      {icon}
      <div className="text-[11px] font-medium uppercase leading-tight tracking-wider opacity-95">
        {subtitle}
      </div>
    </div>
  );
};

type GaugeCellProps = {
  pct: number | null;
  color: string;
  mobileLabel: string;
  bg?: string;
  onEnter: () => void;
};

const GaugeCell: FC<GaugeCellProps> = ({
  pct,
  color,
  mobileLabel,
  bg,
  onEnter,
}) => {
  return (
    <div
      onMouseEnter={onEnter}
      style={{ backgroundColor: bg }}
      className="flex h-full w-full flex-col items-center justify-center gap-1 pb-4 transition-colors md:border-l md:border-blue-400 md:py-4 dark:md:border-blue-300-dark/60"
    >
      <span className="block text-center text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden">
        {mobileLabel}
      </span>
      <ConsequenceGauge pct={pct} color={color} />
    </div>
  );
};

"use client";

import { FC, ReactNode, useState } from "react";

import ConsequenceGauge from "./consequence_gauge";
import { DonkeyIcon, ElephantIcon } from "./party_icons";
import { MIDTERMS_COLORS } from "../constants";
import { useIsDark } from "../helpers/use_is_dark";

type Column = "dem" | "split" | "rep";

// Shared column template: the question takes ~62% and the three scenario
// columns split the rest. Header and rows use the same template (and gap-0)
// so the colored headers line up with the gauges below them.
const COLS = "md:grid-cols-[5fr_1fr_1fr_1fr]";

export type ConsequenceGridRow = {
  key: string;
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

const ConsequenceGrid: FC<Props> = ({
  leadingSlot,
  rows,
  demHeader,
  splitHeader,
  repHeader,
}) => {
  const isDark = useIsDark();
  const [hovered, setHovered] = useState<Column | null>(null);

  const enter = (col: Column) => () => setHovered(col);
  const leave = () => setHovered(null);

  const repBg = isDark ? REP_HEADER_BG.dark : REP_HEADER_BG.light;
  const demBg = isDark ? DEM_HEADER_BG.dark : DEM_HEADER_BG.light;
  const splitBg = isDark ? SPLIT_HEADER_BG.dark : SPLIT_HEADER_BG.light;
  const gauge = (col: Column) =>
    isDark ? GAUGE_COLOR[col].dark : GAUGE_COLOR[col].light;

  return (
    <div>
      {/* Header row: lead slot in col 1 (title + description), party
          cards in cols 2-4. Uses the same template + gap-0 as the rows so
          the cards align with the gauges; per-card padding keeps a small
          gap between them. */}
      <div className={`hidden md:mb-4 md:grid ${COLS} md:items-end md:gap-0`}>
        <div className="md:pr-4">{leadingSlot}</div>
        <div className="md:px-1">
          <PartyHeader
            background={demBg.rest}
            activeBackground={demBg.active}
            icon={<DonkeyIcon width={26} height={26} className="shrink-0" />}
            title={demHeader.title}
            subtitle={demHeader.subtitle}
            active={hovered === "dem"}
            onMouseEnter={enter("dem")}
            onMouseLeave={leave}
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
            active={hovered === "split"}
            onMouseEnter={enter("split")}
            onMouseLeave={leave}
          />
        </div>
        <div className="md:px-1">
          <PartyHeader
            background={repBg.rest}
            activeBackground={repBg.active}
            icon={<ElephantIcon width={26} height={26} className="shrink-0" />}
            title={repHeader.title}
            subtitle={repHeader.subtitle}
            active={hovered === "rep"}
            onMouseEnter={enter("rep")}
            onMouseLeave={leave}
          />
        </div>
      </div>

      {/* Mobile-only leading slot (when md grid above is hidden). */}
      <div className="mb-6 md:hidden">{leadingSlot}</div>

      {rows.map((row) => (
        <div
          key={row.key}
          className={`grid grid-cols-3 border-b border-blue-300 last:border-0 dark:border-blue-300-dark ${COLS} md:gap-0`}
        >
          {/* Mobile: question spans the full width with the three gauges in
              a row beneath it. Desktop: question is the first column. */}
          <p className="col-span-3 m-0 flex items-center pb-2 pt-4 text-sm font-medium text-blue-800 dark:text-blue-800-dark md:col-span-1 md:py-4 md:pr-4 md:text-base">
            {row.question}
          </p>
          <GaugeCell
            pct={row.demPct}
            color={gauge("dem")}
            mobileLabel={row.ifDemLabel}
            onMouseEnter={enter("dem")}
            onMouseLeave={leave}
          />
          <GaugeCell
            pct={row.splitPct}
            color={gauge("split")}
            mobileLabel={row.ifSplitLabel}
            onMouseEnter={enter("split")}
            onMouseLeave={leave}
          />
          <GaugeCell
            pct={row.repPct}
            color={gauge("rep")}
            mobileLabel={row.ifRepLabel}
            onMouseEnter={enter("rep")}
            onMouseLeave={leave}
          />
        </div>
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
  onMouseLeave: () => void;
};

const PartyHeader: FC<PartyHeaderProps> = ({
  background,
  activeBackground,
  icon,
  title,
  subtitle,
  active,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      aria-label={title}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-white transition-[background] duration-150"
      style={{ background: active ? activeBackground : background }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const GaugeCell: FC<GaugeCellProps> = ({
  pct,
  color,
  mobileLabel,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex h-full w-full flex-col items-center justify-center gap-1 pb-4 md:border-l md:border-blue-300 md:py-4 dark:md:border-blue-300-dark"
    >
      <span className="block text-center text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden">
        {mobileLabel}
      </span>
      <ConsequenceGauge pct={pct} color={color} />
    </div>
  );
};

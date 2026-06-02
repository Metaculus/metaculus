"use client";

import { FC, ReactNode, useState } from "react";

import CvBar, { GradientColorStop, ThemedColor } from "./cv_bar";
import { DonkeyIcon, ElephantIcon } from "./party_icons";
import { MIDTERMS_COLORS } from "../constants";
import { useIsDark } from "../helpers/use_is_dark";

type Column = "dem" | "split" | "rep";

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
//
// Light mode: rest is the primary border shade, active goes darker —
// so hover deepens the color (matches the bars below).
//
// Dark mode: rest is the darker shade, active is the brighter shade —
// hover goes LIGHTER, matching the bar-fill behavior in dark mode (the
// bars also lighten on hover because they sit on a dark card bg).
const REP_HEADER_BG = {
  light: { rest: MIDTERMS_COLORS.repBorder, active: "#A02B25" },
  dark: { rest: "#B83C32", active: MIDTERMS_COLORS.repBorderDark },
};
const DEM_HEADER_BG = {
  light: { rest: "#1E3A8A", active: "#152A66" },
  dark: { rest: "#4A5FCF", active: MIDTERMS_COLORS.demBorderDark },
};

// Split column blends the Dem (left) and Rep (right) header colors into a
// horizontal gradient so neither party "owns" it.
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

// Themed bar colors.
const DEM_FILL: ThemedColor = {
  light: MIDTERMS_COLORS.demPrimary,
  dark: MIDTERMS_COLORS.demPrimaryDark,
};
const DEM_BORDER: ThemedColor = {
  light: MIDTERMS_COLORS.demBorder,
  dark: MIDTERMS_COLORS.demBorderDark,
};
const REP_FILL: ThemedColor = {
  light: MIDTERMS_COLORS.repPrimary,
  dark: MIDTERMS_COLORS.repPrimaryDark,
};
const REP_BORDER: ThemedColor = {
  light: MIDTERMS_COLORS.repBorder,
  dark: MIDTERMS_COLORS.repBorderDark,
};

// Split bars use a horizontal gradient (Dem left → Rep right) with a
// matching gradient border.
const SPLIT_GRADIENT: [GradientColorStop, GradientColorStop] = [
  { fill: DEM_FILL, border: DEM_BORDER },
  { fill: REP_FILL, border: REP_BORDER },
];

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

  return (
    <div>
      {/* Header row: lead slot in col 1 (title + description), party
          cards in cols 2-4. Mobile collapses to single column and the
          lead slot is rendered above the rows (no party cards). */}
      <div className="hidden md:mb-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:items-end md:gap-4">
        <div>{leadingSlot}</div>
        <PartyHeader
          background={demBg.rest}
          activeBackground={demBg.active}
          icon={<DonkeyIcon width={32} height={32} className="shrink-0" />}
          title={demHeader.title}
          subtitle={demHeader.subtitle}
          active={hovered === "dem"}
          onMouseEnter={enter("dem")}
          onMouseLeave={leave}
        />
        <PartyHeader
          background={splitBg.rest}
          activeBackground={splitBg.active}
          icon={
            <span className="flex shrink-0 items-center gap-0.5">
              <DonkeyIcon width={22} height={22} />
              <ElephantIcon width={22} height={22} />
            </span>
          }
          title={splitHeader.title}
          subtitle={splitHeader.subtitle}
          active={hovered === "split"}
          onMouseEnter={enter("split")}
          onMouseLeave={leave}
        />
        <PartyHeader
          background={repBg.rest}
          activeBackground={repBg.active}
          icon={<ElephantIcon width={32} height={32} className="shrink-0" />}
          title={repHeader.title}
          subtitle={repHeader.subtitle}
          active={hovered === "rep"}
          onMouseEnter={enter("rep")}
          onMouseLeave={leave}
        />
      </div>

      {/* Mobile-only leading slot (when md grid above is hidden). */}
      <div className="mb-6 md:hidden">{leadingSlot}</div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-1 gap-3 border-b border-blue-300 last:border-0 dark:border-blue-300-dark md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-0"
        >
          {/* Vertical padding lives inside each grid cell (not the row) so
              the cell's mouseenter handler covers the entire row-height
              footprint of that column, including the breathing room
              above and below the bar. */}
          <p className="m-0 flex items-center py-4 text-sm font-medium text-blue-800 dark:text-blue-800-dark md:pr-4 md:text-base">
            {row.question}
          </p>
          <BarCell
            pct={row.demPct}
            color={DEM_FILL}
            borderColor={DEM_BORDER}
            mobileLabel={row.ifDemLabel}
            active={hovered === "dem"}
            onMouseEnter={enter("dem")}
            onMouseLeave={leave}
          />
          <BarCell
            pct={row.splitPct}
            gradientColors={SPLIT_GRADIENT}
            mobileLabel={row.ifSplitLabel}
            active={hovered === "split"}
            onMouseEnter={enter("split")}
            onMouseLeave={leave}
          />
          <BarCell
            pct={row.repPct}
            color={REP_FILL}
            borderColor={REP_BORDER}
            mobileLabel={row.ifRepLabel}
            active={hovered === "rep"}
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
      className="flex items-center gap-3 rounded-md px-4 py-2.5 text-white transition-[background] duration-150"
      style={{ background: active ? activeBackground : background }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {icon}
      <div className="leading-tight">
        <div className="text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-90">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

type BarCellProps = {
  pct: number | null;
  color?: ThemedColor;
  borderColor?: ThemedColor;
  gradientColors?: [GradientColorStop, GradientColorStop];
  mobileLabel: string;
  active: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const BarCell: FC<BarCellProps> = ({
  pct,
  color,
  borderColor,
  gradientColors,
  mobileLabel,
  active,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex h-full w-full flex-col justify-center py-4 md:px-2"
    >
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden">
        {mobileLabel}
      </span>
      <div className="flex items-center">
        <CvBar
          pct={pct ?? 0}
          color={color}
          borderColor={borderColor}
          gradientColors={gradientColors}
          active={active}
        />
        <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
          {pct != null ? `${pct}%` : "—"}
        </span>
      </div>
    </div>
  );
};

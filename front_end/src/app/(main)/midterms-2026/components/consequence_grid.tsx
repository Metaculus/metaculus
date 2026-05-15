"use client";

import { FC, ReactNode, useState } from "react";

import useAppTheme from "@/hooks/use_app_theme";

import CvBar, { ThemedColor } from "./cv_bar";
import { DonkeyIcon, ElephantIcon } from "./party_icons";
import { MIDTERMS_COLORS } from "../constants";

type Column = "rep" | "dem";

export type ConsequenceGridRow = {
  key: string;
  question: string;
  repPct: number;
  demPct: number;
  ifRepLabel: string;
  ifDemLabel: string;
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
  repHeader: ConsequenceHeaderCopy;
  demHeader: ConsequenceHeaderCopy;
};

// Header card backgrounds. Each color has rest + active variants per
// theme so the column reads as visibly lit when hovered.
const REP_HEADER_BG = {
  light: { rest: MIDTERMS_COLORS.repBorder, active: "#A02B25" },
  dark: { rest: MIDTERMS_COLORS.repBorderDark, active: "#B83C32" },
};
const DEM_HEADER_BG = {
  light: { rest: "#1E3A8A", active: "#152A66" },
  dark: { rest: MIDTERMS_COLORS.demBorderDark, active: "#4A5FCF" },
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

const ConsequenceGrid: FC<Props> = ({
  leadingSlot,
  rows,
  repHeader,
  demHeader,
}) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const [hovered, setHovered] = useState<Column | null>(null);

  const enter = (col: Column) => () => setHovered(col);
  const leave = () => setHovered(null);

  const repBg = isDark ? REP_HEADER_BG.dark : REP_HEADER_BG.light;
  const demBg = isDark ? DEM_HEADER_BG.dark : DEM_HEADER_BG.light;

  return (
    <div>
      {/* Header row: lead slot in col 1 (title + description), party
          cards in cols 2 & 3. Mobile collapses to single column and the
          lead slot is rendered above the rows (no party cards). */}
      <div className="hidden md:mb-4 md:grid md:grid-cols-[2fr_1fr_1fr] md:items-end md:gap-4">
        <div>{leadingSlot}</div>
        <PartyHeader
          backgroundColor={repBg.rest}
          activeBackgroundColor={repBg.active}
          Icon={ElephantIcon}
          title={repHeader.title}
          subtitle={repHeader.subtitle}
          active={hovered === "rep"}
          onMouseEnter={enter("rep")}
          onMouseLeave={leave}
        />
        <PartyHeader
          backgroundColor={demBg.rest}
          activeBackgroundColor={demBg.active}
          Icon={DonkeyIcon}
          title={demHeader.title}
          subtitle={demHeader.subtitle}
          active={hovered === "dem"}
          onMouseEnter={enter("dem")}
          onMouseLeave={leave}
        />
      </div>

      {/* Mobile-only leading slot (when md grid above is hidden). */}
      <div className="mb-6 md:hidden">{leadingSlot}</div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-1 gap-3 border-b border-blue-300 py-4 last:border-0 dark:border-blue-300-dark md:grid-cols-[2fr_1fr_1fr] md:gap-0"
        >
          <p className="m-0 self-center text-sm font-medium text-blue-800 dark:text-blue-800-dark md:pr-4 md:text-base">
            {row.question}
          </p>
          <BarCell
            pct={row.repPct}
            color={REP_FILL}
            borderColor={REP_BORDER}
            mobileLabel={row.ifRepLabel}
            active={hovered === "rep"}
            onMouseEnter={enter("rep")}
            onMouseLeave={leave}
          />
          <BarCell
            pct={row.demPct}
            color={DEM_FILL}
            borderColor={DEM_BORDER}
            mobileLabel={row.ifDemLabel}
            active={hovered === "dem"}
            onMouseEnter={enter("dem")}
            onMouseLeave={leave}
          />
        </div>
      ))}
    </div>
  );
};

export default ConsequenceGrid;

type PartyHeaderProps = {
  backgroundColor: string;
  activeBackgroundColor: string;
  Icon: typeof ElephantIcon;
  title: string;
  subtitle: string;
  active: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const PartyHeader: FC<PartyHeaderProps> = ({
  backgroundColor,
  activeBackgroundColor,
  Icon,
  title,
  subtitle,
  active,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      className="flex items-center gap-3 rounded-md px-4 py-2.5 text-white transition-colors duration-150"
      style={{
        backgroundColor: active ? activeBackgroundColor : backgroundColor,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Icon width={32} height={32} className="shrink-0" aria-hidden="true" />
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
  pct: number;
  color: ThemedColor;
  borderColor: ThemedColor;
  mobileLabel: string;
  active: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const BarCell: FC<BarCellProps> = ({
  pct,
  color,
  borderColor,
  mobileLabel,
  active,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex h-full w-full flex-col justify-center md:px-2"
    >
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden">
        {mobileLabel}
      </span>
      <div className="flex items-center">
        <CvBar
          pct={pct}
          color={color}
          borderColor={borderColor}
          active={active}
        />
        <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
          {pct}%
        </span>
      </div>
    </div>
  );
};

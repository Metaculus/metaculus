"use client";

import { FC, useState } from "react";

import cn from "@/utils/core/cn";

import CvBar from "./cv_bar";
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
  rows: ConsequenceGridRow[];
  repHeader: ConsequenceHeaderCopy;
  demHeader: ConsequenceHeaderCopy;
};

// Header card colors. The "active" variants are darker / more saturated so
// the column reads as visibly lit when the user hovers anywhere inside it.
const REP_HEADER_BG = MIDTERMS_COLORS.repBorder; // #C53B33
const REP_HEADER_BG_ACTIVE = "#A02B25";
const DEM_HEADER_BG = "#1E3A8A"; // Tailwind blue-900
const DEM_HEADER_BG_ACTIVE = "#152A66";

const ConsequenceGrid: FC<Props> = ({ rows, repHeader, demHeader }) => {
  const [hovered, setHovered] = useState<Column | null>(null);

  const enter = (col: Column) => () => setHovered(col);
  const leave = () => setHovered(null);

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark sm:p-5">
      <div className="mb-4 hidden md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-4">
        {/* Empty header above the Question column. */}
        <div />
        <PartyHeader
          backgroundColor={REP_HEADER_BG}
          activeBackgroundColor={REP_HEADER_BG_ACTIVE}
          Icon={ElephantIcon}
          title={repHeader.title}
          subtitle={repHeader.subtitle}
          active={hovered === "rep"}
          onMouseEnter={enter("rep")}
          onMouseLeave={leave}
        />
        <PartyHeader
          backgroundColor={DEM_HEADER_BG}
          activeBackgroundColor={DEM_HEADER_BG_ACTIVE}
          Icon={DonkeyIcon}
          title={demHeader.title}
          subtitle={demHeader.subtitle}
          active={hovered === "dem"}
          onMouseEnter={enter("dem")}
          onMouseLeave={leave}
        />
      </div>

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-1 gap-3 border-b border-blue-300 py-4 last:border-0 dark:border-blue-300-dark md:grid-cols-[2fr_1fr_1fr] md:gap-4"
        >
          <p className="m-0 text-sm font-medium text-blue-800 dark:text-blue-800-dark md:text-base">
            {row.question}
          </p>
          <BarCell
            pct={row.repPct}
            color={MIDTERMS_COLORS.repPrimary}
            borderColor={MIDTERMS_COLORS.repBorder}
            mobileLabel={row.ifRepLabel}
            active={hovered === "rep"}
            onMouseEnter={enter("rep")}
            onMouseLeave={leave}
          />
          <BarCell
            pct={row.demPct}
            color={MIDTERMS_COLORS.demPrimary}
            borderColor={MIDTERMS_COLORS.demBorder}
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
  color: string;
  borderColor: string;
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
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span
        className={cn(
          "mb-1 block text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden"
        )}
      >
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

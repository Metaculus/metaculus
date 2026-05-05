"use client";

import { useTranslations } from "next-intl";
import { FC, MouseEvent, useState } from "react";

import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import { US_TILE_GRID } from "../data";
import StateTooltipContent from "./state_tooltip";
import {
  getCommentsCount,
  getDemWinPct,
  getForecastersCount,
  SenateRaceWithPost,
} from "../helpers/post_utils";
import { getStateColor } from "../helpers/state_color";

type Props = {
  races: SenateRaceWithPost[];
};

type HoverState = {
  abbr: string;
  x: number;
  y: number;
} | null;

const MAX_COL = Math.max(...US_TILE_GRID.map((c) => c.col));
const MAX_ROW = Math.max(...US_TILE_GRID.map((c) => c.row));

const TileMap: FC<Props> = ({ races }) => {
  const [hovered, setHovered] = useState<HoverState>(null);
  const racesByState = new Map(races.map((r) => [r.state, r]));

  const handleEnter = (abbr: string, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parent = e.currentTarget.closest(".tile-map-container");
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    setHovered({
      abbr,
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top,
    });
  };

  const hoveredRace = hovered ? racesByState.get(hovered.abbr) : null;

  return (
    <div className="tile-map-container relative">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${MAX_COL + 1}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${MAX_ROW + 1}, minmax(0, 1fr))`,
        }}
      >
        {US_TILE_GRID.map(({ abbr, row, col }) => {
          const race = racesByState.get(abbr);
          const demWinPct = getDemWinPct(race?.post ?? null);
          const fillColor = getStateColor(demWinPct);
          const isContested = race !== undefined;

          return (
            <button
              key={abbr}
              type="button"
              onMouseEnter={(e) => isContested && handleEnter(abbr, e)}
              onMouseLeave={() => setHovered(null)}
              disabled={!isContested}
              aria-label={STATE_NAMES[abbr] ?? abbr}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-xs font-medium transition-transform duration-150 ease-out",
                isContested
                  ? "cursor-pointer hover:scale-105"
                  : "cursor-default"
              )}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                backgroundColor: fillColor,
                color: isContested ? "#FFFFFF" : "#777",
              }}
            >
              {abbr}
            </button>
          );
        })}
      </div>

      {hoveredRace && hovered && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: hovered.x,
            top: hovered.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <StateTooltipContent
            race={hoveredRace}
            demWinPct={getDemWinPct(hoveredRace.post)}
            forecasters={getForecastersCount(hoveredRace.post)}
            comments={getCommentsCount(hoveredRace.post)}
          />
        </div>
      )}

      <Legend />
    </div>
  );
};

const Legend: FC = () => {
  const t = useTranslations();
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-600-dark">
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.demPrimary }}
        />
        {t("midtermsHubDemocrat")}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.repPrimary }}
        />
        {t("midtermsHubRepublican")}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-white dark:border-gray-400-dark" />
        {t("midtermsHubNotContested")}
      </span>
    </div>
  );
};

export default TileMap;

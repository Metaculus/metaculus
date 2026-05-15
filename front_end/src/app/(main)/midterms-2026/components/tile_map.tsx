"use client";

import { FC, MouseEvent, useRef, useState } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import { US_TILE_GRID } from "../data";
import MapLegend from "./map_legend";
import MapTooltipPortal from "./map_tooltip_portal";
import StateTooltipContent from "./state_tooltip";
import { getDemWinPct, SenateRaceWithQuestion } from "../helpers/post_utils";
import { getStateColor } from "../helpers/state_color";

type Props = {
  races: SenateRaceWithQuestion[];
};

type HoverState = {
  abbr: string;
  /** Document-space coordinates so the portalled tooltip can position
   *  outside the SectionCard's overflow-hidden boundary. */
  x: number;
  y: number;
} | null;

const MAX_COL = Math.max(...US_TILE_GRID.map((c) => c.col));
const MAX_ROW = Math.max(...US_TILE_GRID.map((c) => c.row));

const UNCONTESTED_OPACITY_DEFAULT = 0.75;

const TileMap: FC<Props> = ({ races }) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";
  const uncontestedFill = isDark
    ? MIDTERMS_COLORS.uncontestedDark
    : MIDTERMS_COLORS.uncontestedLight;

  const [hovered, setHovered] = useState<HoverState>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const racesByState = new Map(races.map((r) => [r.state, r]));

  const showTooltipFor = (abbr: string, e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHovered({
      abbr,
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + window.scrollY,
    });
  };

  const navigate = (race: SenateRaceWithQuestion | undefined) => {
    if (!race?.parentPost || !race.question) return;
    const url = `/questions/${race.parentPost.id}/?sub-question=${race.question.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTileClick = (
    abbr: string,
    race: SenateRaceWithQuestion | undefined,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    if (!race) return;
    // On touch devices, first tap reveals the tooltip; navigation happens
    // when the user taps the tooltip itself.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches
    ) {
      if (hovered?.abbr === abbr) {
        setHovered(null);
      } else {
        showTooltipFor(abbr, e);
      }
      return;
    }
    navigate(race);
  };

  const hoveredRace = hovered ? racesByState.get(hovered.abbr) : null;

  return (
    <div ref={containerRef} className="tile-map-container relative">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${MAX_COL + 1}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${MAX_ROW + 1}, minmax(0, 1fr))`,
        }}
      >
        {US_TILE_GRID.map(({ abbr, row, col }) => {
          const race = racesByState.get(abbr);
          const isContested = race !== undefined;
          const fillColor = isContested
            ? getStateColor(getDemWinPct(race.question))
            : uncontestedFill;

          return (
            <button
              key={abbr}
              type="button"
              onMouseEnter={(e) => isContested && showTooltipFor(abbr, e)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => handleTileClick(abbr, race, e)}
              disabled={!isContested}
              aria-label={STATE_NAMES[abbr] ?? abbr}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-xs font-medium transition-transform duration-150 ease-out",
                isContested
                  ? "cursor-pointer text-white hover:scale-105"
                  : "cursor-default text-blue-600 dark:text-blue-600-dark"
              )}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                backgroundColor: fillColor,
                opacity: isContested ? 1 : UNCONTESTED_OPACITY_DEFAULT,
                // Dark mode: pastel tile fills make white text hard to
                // read. Override to the dark navy token.
                ...(isContested && isDark
                  ? { color: MIDTERMS_COLORS.tileTextDark }
                  : {}),
              }}
            >
              {abbr}
            </button>
          );
        })}
      </div>

      {hoveredRace && hovered && (
        <MapTooltipPortal
          x={hovered.x}
          y={hovered.y}
          onClick={() => navigate(hoveredRace)}
          insideRef={containerRef}
          onDismiss={() => setHovered(null)}
        >
          <StateTooltipContent
            race={hoveredRace}
            demWinPct={getDemWinPct(hoveredRace.question)}
          />
        </MapTooltipPortal>
      )}

      <MapLegend className="mt-4 flex-row items-center justify-center gap-4" />
    </div>
  );
};

export default TileMap;

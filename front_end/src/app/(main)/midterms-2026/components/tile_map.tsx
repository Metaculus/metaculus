"use client";

import { FC, MouseEvent, useRef, useState } from "react";

import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import { US_TILE_GRID } from "../data";
import MapTooltipPortal from "./map_tooltip_portal";
import StateTooltipContent from "./state_tooltip";
import { SenateRaceWithQuestion } from "../helpers/post_utils";
import { getStateColor } from "../helpers/state_color";
import { useIsDark } from "../helpers/use_is_dark";

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

// Halved in light mode so the grey recedes and the warm toss-up fill separates
// from it; dark mode already distinguishes the two. Matches geographic_map.tsx.
const UNCONTESTED_OPACITY_DEFAULT_DARK = 0.75;
const UNCONTESTED_OPACITY_DEFAULT_LIGHT = 0.375;

const TileMap: FC<Props> = ({ races }) => {
  const isDark = useIsDark();
  const uncontestedOpacity = isDark
    ? UNCONTESTED_OPACITY_DEFAULT_DARK
    : UNCONTESTED_OPACITY_DEFAULT_LIGHT;
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
    if (!race?.href) return;
    window.open(race.href, "_blank", "noopener,noreferrer");
  };

  const handleTileClick = (
    abbr: string,
    race: SenateRaceWithQuestion | undefined,
    e: MouseEvent<HTMLButtonElement>
  ) => {
    if (!race) return;
    // A safe or unrated race has no destination; the tap only toggles its
    // tooltip, which is the whole of its content.
    if (!race.href) {
      if (hovered?.abbr === abbr) setHovered(null);
      else showTooltipFor(abbr, e);
      return;
    }
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
          // Mirrors the geographic map: a question makes the tile navigable, a
          // safe rating paints it without a destination, and anything else is
          // an inert grey tile. `race` alone no longer implies either.
          const canOpen = race?.href != null;
          const safeParty = race?.rating ?? null;
          const fillColor = safeParty
            ? getStateColor(safeParty === "D" ? 100 : 0)
            : race?.demWinPct != null
              ? getStateColor(race.demWinPct)
              : uncontestedFill;
          const isFilled = safeParty != null || race?.demWinPct != null;

          return (
            <button
              key={abbr}
              type="button"
              // Every race gets a tooltip, including the ones going nowhere —
              // that is the only place "Safe Republican" is stated.
              onMouseEnter={(e) => race && showTooltipFor(abbr, e)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => handleTileClick(abbr, race, e)}
              disabled={!race}
              aria-label={STATE_NAMES[abbr] ?? abbr}
              className={cn(
                "flex aspect-square items-center justify-center rounded-sm text-xs font-medium transition-transform duration-150 ease-out",
                canOpen && "hover:scale-105",
                isFilled
                  ? "text-white"
                  : "text-blue-600 dark:text-blue-600-dark",
                canOpen ? "cursor-pointer" : "cursor-default",
                // Active tile (its tooltip is open): thick contrast outline
                // until the tooltip is dismissed.
                hovered?.abbr === abbr &&
                  "relative z-10 ring-[3px] ring-blue-900 dark:ring-blue-100"
              )}
              style={{
                gridColumn: col + 1,
                gridRow: row + 1,
                backgroundColor: fillColor,
                opacity: isFilled ? 1 : uncontestedOpacity,
                // Dark mode: pastel tile fills make white text hard to
                // read. Override to the dark navy token.
                ...(isFilled && isDark
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
            demWinPct={hoveredRace.demWinPct}
          />
        </MapTooltipPortal>
      )}
    </div>
  );
};

export default TileMap;

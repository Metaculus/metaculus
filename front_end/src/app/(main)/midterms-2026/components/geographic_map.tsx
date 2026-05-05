"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ExperimentMap from "@/app/(main)/experiments/components/experiment_map";
import { BaseMapArea, MapType } from "@/types/experiments";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
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

type StateMapArea = BaseMapArea & {
  race: SenateRaceWithPost | null;
};

const GeographicMap: FC<Props> = ({ races }) => {
  const racesByState = useMemo(
    () => new Map(races.map((r) => [r.state, r])),
    [races]
  );

  const mapAreas: StateMapArea[] = useMemo(
    () =>
      Object.keys(STATE_NAMES).map((abbr) => ({
        abbreviation: abbr,
        name: STATE_NAMES[abbr] ?? abbr,
        x_adjust: 0,
        y_adjust: 0,
        race: racesByState.get(abbr) ?? null,
      })),
    [racesByState]
  );

  const getMapAreaColor = (area: StateMapArea) => {
    if (!area.race) return MIDTERMS_COLORS.notContested;
    return getStateColor(getDemWinPct(area.race.post));
  };

  return (
    <div className="space-y-4">
      <ExperimentMap
        mapType={MapType.US}
        mapAreas={mapAreas}
        getMapAreaColor={getMapAreaColor}
        renderHoverPopover={({ x, y, mapArea, onMouseEnter, onMouseLeave }) => {
          if (!mapArea?.race) return null;
          return (
            <div
              className="pointer-events-auto absolute z-10"
              style={{
                left: x,
                top: y,
                transform: "translate(-50%, calc(-100% - 8px))",
              }}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <StateTooltipContent
                race={mapArea.race}
                demWinPct={getDemWinPct(mapArea.race.post)}
                forecasters={getForecastersCount(mapArea.race.post)}
                comments={getCommentsCount(mapArea.race.post)}
              />
            </div>
          );
        }}
      />
      <Legend />
    </div>
  );
};

const Legend: FC = () => {
  const t = useTranslations();
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-600-dark">
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

export default GeographicMap;

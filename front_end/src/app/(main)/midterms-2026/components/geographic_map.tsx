"use client";

import { geoAlbersUsa } from "d3-geo";
import { FC, MouseEvent, ReactNode, useMemo, useRef, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  GeographyType,
} from "react-simple-maps";

import useAppTheme from "@/hooks/use_app_theme";

import { MIDTERMS_COLORS } from "../constants";
import MapLegend from "./map_legend";
import MapTooltipPortal from "./map_tooltip_portal";
import StateTooltipContent from "./state_tooltip";
import { getDemWinPct, SenateRaceWithQuestion } from "../helpers/post_utils";
import { getStateColor } from "../helpers/state_color";

const GEO_URL = "/us-states-10m.json";

const FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

type Props = {
  races: SenateRaceWithQuestion[];
  /** Tabs slot (rendered absolute top-left). */
  tabsSlot?: ReactNode;
};

type HoverState = {
  abbr: string;
  x: number;
  y: number;
} | null;

// Tuned by hand via the dev slider widget.
const MAP_VIEWBOX_WIDTH = 760;
const MAP_VIEWBOX_HEIGHT = 540;
const MAP_SCALE = 970;
const MAP_TRANSLATE: [number, number] = [385, 290];

// Light-mode default/hover opacities for uncontested states.
const UNCONTESTED_OPACITY_DEFAULT = 0.75;
const UNCONTESTED_OPACITY_HOVER = 1;

const GeographicMap: FC<Props> = ({ races, tabsSlot }) => {
  const { theme } = useAppTheme();
  const isDark = theme === "dark";

  const strokeColor = isDark
    ? MIDTERMS_COLORS.cardBgDark
    : MIDTERMS_COLORS.cardBgLight;
  const uncontestedFill = isDark
    ? MIDTERMS_COLORS.uncontestedDark
    : MIDTERMS_COLORS.uncontestedLight;
  const uncontestedHoverFill = isDark
    ? MIDTERMS_COLORS.uncontestedHoverDark
    : MIDTERMS_COLORS.uncontestedHoverLight;

  const racesByState = useMemo(
    () => new Map(races.map((r) => [r.state, r])),
    [races]
  );

  const [hovered, setHovered] = useState<HoverState>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // react-simple-maps' MapProvider hardcodes translate to viewbox center, so
  // we provide a fully-configured projection function instead.
  const projection = useMemo(
    () => geoAlbersUsa().scale(MAP_SCALE).translate(MAP_TRANSLATE),
    []
  );

  const handleEnter = (abbr: string, e: MouseEvent<SVGPathElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHovered({
      abbr,
      x: rect.left + rect.width / 2 + window.scrollX,
      y: rect.top + window.scrollY,
    });
  };

  const handleClick = (race: SenateRaceWithQuestion | undefined) => {
    if (!race?.parentPost || !race.question) return;
    const url = `/questions/${race.parentPost.id}/?sub-question=${race.question.id}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const hoveredRace = hovered ? racesByState.get(hovered.abbr) : null;

  return (
    <div
      ref={containerRef}
      className="geo-map-container relative h-full w-full"
    >
      {tabsSlot && (
        <div className="absolute left-5 top-5 z-10 md:left-10 md:top-10">
          {tabsSlot}
        </div>
      )}
      <div className="absolute right-5 top-5 z-10 md:right-10 md:top-12 lg:right-0">
        <MapLegend />
      </div>
      <div className="h-full w-full overflow-hidden">
        <ComposableMap
          projection={projection as unknown as string}
          width={MAP_VIEWBOX_WIDTH}
          height={MAP_VIEWBOX_HEIGHT}
          preserveAspectRatio="xMaxYMid slice"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeographyType[] }) =>
              geographies.map((geo) => {
                const abbr = FIPS_TO_ABBR[String(geo.id ?? "")];
                const race = abbr ? racesByState.get(abbr) : undefined;
                const isContested = race !== undefined;
                const isHovered = hovered?.abbr === abbr;

                const fillColor = isContested
                  ? getStateColor(getDemWinPct(race?.question ?? null))
                  : isHovered
                    ? uncontestedHoverFill
                    : uncontestedFill;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) =>
                      isContested && abbr && handleEnter(abbr, e)
                    }
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => isContested && handleClick(race)}
                    style={{
                      default: {
                        fill: fillColor,
                        stroke: strokeColor,
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: isContested ? "pointer" : "default",
                        opacity: isContested ? 1 : UNCONTESTED_OPACITY_DEFAULT,
                        transition:
                          "fill 150ms ease-out, opacity 150ms ease-out, filter 150ms ease-out",
                        filter:
                          isContested && isHovered
                            ? "brightness(0.9)"
                            : undefined,
                      },
                      hover: {
                        fill: isContested ? fillColor : uncontestedHoverFill,
                        stroke: strokeColor,
                        strokeWidth: isContested ? 2 : 1.5,
                        outline: "none",
                        cursor: isContested ? "pointer" : "default",
                        opacity: isContested ? 1 : UNCONTESTED_OPACITY_HOVER,
                        filter: isContested ? "brightness(0.9)" : undefined,
                      },
                      pressed: {
                        fill: fillColor,
                        stroke: strokeColor,
                        strokeWidth: isContested ? 2 : 1.5,
                        outline: "none",
                        opacity: isContested ? 1 : UNCONTESTED_OPACITY_HOVER,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {hoveredRace && hovered && (
        <MapTooltipPortal
          x={hovered.x}
          y={hovered.y}
          onClick={() => handleClick(hoveredRace)}
          insideRef={containerRef}
          onDismiss={() => setHovered(null)}
        >
          <StateTooltipContent
            race={hoveredRace}
            demWinPct={getDemWinPct(hoveredRace.question)}
          />
        </MapTooltipPortal>
      )}
    </div>
  );
};

export default GeographicMap;

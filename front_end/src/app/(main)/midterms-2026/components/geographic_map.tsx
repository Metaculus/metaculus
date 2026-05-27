"use client";

import { CustomProjection } from "@visx/geo";
import { geoAlbersUsa } from "d3-geo";
import type { Feature as GeoFeature, Geometry } from "geojson";
import {
  CSSProperties,
  FC,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { feature as topoToGeoFeature } from "topojson-client";
import type {
  GeometryCollection as TopoGeometryCollection,
  Topology,
} from "topojson-specification";

import useAppTheme from "@/hooks/use_app_theme";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
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

// Centered projection that fits CONUS + AK + HI inside the viewbox. The
// X translate is biased slightly past center so the map sits a hair right
// of dead-center, leaving breathing room on the left next to the chamber
// tabs overlay.
const MAP_VIEWBOX_WIDTH = 760;
const MAP_VIEWBOX_HEIGHT = 540;
const MAP_SCALE = 1000;
const MAP_TRANSLATE: [number, number] = [400, 270];

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
  // True while the pointer is over the tooltip portal; the SVG path's
  // onMouseLeave defers to this so the tooltip stays mounted long enough
  // for its own onClick to fire.
  const tooltipHoveredRef = useRef(false);
  // Pending leave-clear RAF id. We cancel it whenever the pointer
  // enters a different state directly (state A → state B without
  // crossing empty space) — otherwise the RAF would clear the hover
  // state we *just* set for state B, leaving B looking inactive until
  // the user wiggles back out and in.
  const pendingLeaveRafRef = useRef<number | null>(null);

  // Load + parse the TopoJSON ourselves now that we no longer have
  // react-simple-maps doing it for us. `features` starts empty and
  // populates after the fetch resolves — same behavior as before the
  // RSM internal fetch resolved.
  const [features, setFeatures] = useState<GeoFeature<Geometry>[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((topology: Topology) => {
        if (cancelled) return;
        const states = topology.objects.states as TopoGeometryCollection;
        const collection = topoToGeoFeature(topology, states);
        setFeatures(collection.features as GeoFeature<Geometry>[]);
      })
      .catch(() => {
        // Silently fail — the map column just shows tabs + legend with
        // no states; the rest of the dashboard keeps working.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoized projection factory passed to <CustomProjection>. visx
  // expects a `() => GeoProjection`, which it then configures further
  // via scale/translate/etc. props — but since we provide a fully-
  // configured projection here, those extra props are unset.
  const projectionFactory = useCallback(
    () => geoAlbersUsa().scale(MAP_SCALE).translate(MAP_TRANSLATE),
    []
  );

  const handleEnter = (
    abbr: string,
    e: MouseEvent<SVGPathElement> | FocusEvent<SVGPathElement>
  ) => {
    // Cancel any pending "clear hover" RAF queued by leaving a previous
    // state — otherwise it would fire after this enter and wipe the
    // hover we're setting now.
    if (pendingLeaveRafRef.current !== null) {
      cancelAnimationFrame(pendingLeaveRafRef.current);
      pendingLeaveRafRef.current = null;
    }
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

  const handleLeave = useCallback(() => {
    // Defer clearing so a pointer transition into the tooltip portal has
    // a chance to flip tooltipHoveredRef, OR a direct transition into
    // another state has a chance to cancel this RAF via handleEnter.
    pendingLeaveRafRef.current = requestAnimationFrame(() => {
      pendingLeaveRafRef.current = null;
      if (tooltipHoveredRef.current) return;
      setHovered(null);
    });
  }, []);

  const handleTooltipHoverChange = useCallback((hovering: boolean) => {
    tooltipHoveredRef.current = hovering;
    if (!hovering) setHovered(null);
  }, []);

  const handleKeyDown = (
    e: KeyboardEvent<SVGPathElement>,
    race: SenateRaceWithQuestion
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(race);
    }
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
      <div className="h-full w-full">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX_WIDTH} ${MAP_VIEWBOX_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <CustomProjection<GeoFeature<Geometry>>
            projection={projectionFactory}
            data={features}
          >
            {({ features: parsed }) =>
              parsed.map(({ feature: geo, path: dAttr }, i) => {
                const abbr = FIPS_TO_ABBR[String(geo.id ?? "")];
                const race = abbr ? racesByState.get(abbr) : undefined;
                const isContested = race !== undefined;
                const isHovered = hovered?.abbr === abbr;

                const fillColor = isContested
                  ? getStateColor(getDemWinPct(race?.question ?? null))
                  : isHovered
                    ? uncontestedHoverFill
                    : uncontestedFill;

                const stateName = abbr ? STATE_NAMES[abbr] ?? abbr : "";
                // Mouse enter/leave is wired on every state with a known
                // abbreviation — contested AND uncontested — so all of
                // them get a hover fill swap. The tooltip + click +
                // keyboard handlers are still contested-only; for
                // uncontested states `hoveredRace` is undefined so the
                // tooltip block below short-circuits.
                const hoverHandlers = abbr
                  ? {
                      onMouseEnter: (e: MouseEvent<SVGPathElement>) =>
                        handleEnter(abbr, e),
                      onMouseLeave: handleLeave,
                    }
                  : {};
                const interactiveProps = isContested
                  ? {
                      tabIndex: 0,
                      role: "button",
                      "aria-label": `${stateName} — view forecast question`,
                      "aria-haspopup": "dialog" as const,
                      ...hoverHandlers,
                      onFocus: (e: FocusEvent<SVGPathElement>) =>
                        abbr && handleEnter(abbr, e),
                      onBlur: () => setHovered(null),
                      onKeyDown: (e: KeyboardEvent<SVGPathElement>) =>
                        race && handleKeyDown(e, race),
                      onClick: () => handleClick(race),
                    }
                  : { tabIndex: -1, ...hoverHandlers };

                // react-simple-maps used to drive a default / hover /
                // pressed style state machine internally. Our hover state
                // is the same signal that opens the tooltip, so we
                // collapse to a single inline style toggled off it.
                const style: CSSProperties = isHovered
                  ? {
                      fill: isContested ? fillColor : uncontestedHoverFill,
                      stroke: strokeColor,
                      strokeWidth: isContested ? 2 : 1.5,
                      outline: "none",
                      cursor: isContested ? "pointer" : "default",
                      opacity: isContested ? 1 : UNCONTESTED_OPACITY_HOVER,
                      transition:
                        "fill 150ms ease-out, opacity 150ms ease-out, filter 150ms ease-out",
                      filter: isContested ? "brightness(0.9)" : undefined,
                    }
                  : {
                      fill: fillColor,
                      stroke: strokeColor,
                      strokeWidth: 1.5,
                      outline: "none",
                      cursor: isContested ? "pointer" : "default",
                      opacity: isContested ? 1 : UNCONTESTED_OPACITY_DEFAULT,
                      transition:
                        "fill 150ms ease-out, opacity 150ms ease-out, filter 150ms ease-out",
                    };

                return (
                  <path
                    key={i}
                    d={dAttr ?? ""}
                    {...interactiveProps}
                    style={style}
                  />
                );
              })
            }
          </CustomProjection>
        </svg>
      </div>

      {hoveredRace && hovered && (
        <MapTooltipPortal
          x={hovered.x}
          y={hovered.y}
          onClick={() => handleClick(hoveredRace)}
          insideRef={containerRef}
          onDismiss={() => setHovered(null)}
          onHoverChange={handleTooltipHoverChange}
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

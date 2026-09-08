"use client";

import { CustomProjection } from "@visx/geo";
import { geoAlbersUsa } from "d3-geo";
import type { Feature as GeoFeature, Geometry } from "geojson";
import { useTranslations } from "next-intl";
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

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import MapTooltipPortal from "./map_tooltip_portal";
import StateTooltipContent from "./state_tooltip";
import { SenateRaceWithQuestion } from "../helpers/post_utils";
import { getStateColor } from "../helpers/state_color";
import { useIsDark } from "../helpers/use_is_dark";

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
  /** Tabs slot (rendered top-left of the header overlay). */
  tabsSlot?: ReactNode;
  /** Optional summary line, centered between the tabs and the legend. */
  summarySlot?: ReactNode;
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

// Rest opacity for states with no forecast. Light mode halves it: the toss-up
// fill is a warm grey-beige that sits close enough to the uncontested grey that a
// genuinely balanced race reads as an unforecast one. Letting the grey recede
// further into the card separates them. Dark mode already does, so it keeps the
// original value.
const UNCONTESTED_OPACITY_DEFAULT_DARK = 0.75;
const UNCONTESTED_OPACITY_DEFAULT_LIGHT = 0.375;
const UNCONTESTED_OPACITY_HOVER = 1;

const GeographicMap: FC<Props> = ({ races, tabsSlot, summarySlot }) => {
  const t = useTranslations();
  const isDark = useIsDark();
  const uncontestedOpacity = isDark
    ? UNCONTESTED_OPACITY_DEFAULT_DARK
    : UNCONTESTED_OPACITY_DEFAULT_LIGHT;

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
    if (!race?.href) return;
    window.open(race.href, "_blank", "noopener,noreferrer");
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
      {/* Header overlay: tabs on the left, summary on the right. Absolutely
          positioned as one row so a wrapping summary grows over the map instead
          of pushing it down, while the gap keeps it clear of the tabs.
          The summary occupies the corner the party legend used to; its own
          alignment comes from the className the caller passes, since this cell
          can't override a class the summary sets on itself. */}
      {/* Flush to the container: the map column's own padding provides the inset,
          so the summary clears the dividing rule by the same 40px as everything
          else. */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start gap-6 md:gap-10">
        {tabsSlot && <div className="shrink-0">{tabsSlot}</div>}
        <div className="pointer-events-none min-w-0 flex-1 pt-1.5">
          {summarySlot}
        </div>
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
                // Three kinds of state, not two. A race with a question opens
                // it; a safe seat is painted for its party but leads nowhere;
                // everything else — an unrated race and a state with no 2026
                // contest alike — stays grey. `href` rather than the presence of
                // a race is what makes a state interactive, so a race whose
                // question failed to load no longer offers a dead click.
                const canOpen = race?.href != null;
                const safeParty = race?.rating ?? null;
                // `abbr` is undefined for the territories the topology carries
                // but the abbreviation map does not. Without the guard those
                // compare undefined === undefined against an empty hover state
                // and render permanently hovered.
                const isHovered = abbr != null && hovered?.abbr === abbr;

                // Safe seats take the spectrum endpoint, so they read exactly as
                // a ~99% forecast would. The tooltip is what tells them apart.
                const fillColor = safeParty
                  ? getStateColor(safeParty === "D" ? 100 : 0)
                  : race?.demWinPct != null
                    ? getStateColor(race.demWinPct)
                    : isHovered
                      ? uncontestedHoverFill
                      : uncontestedFill;
                // Anything painted a party color behaves like a forecast state
                // for stroke, opacity and hover feedback.
                const isFilled = safeParty != null || race?.demWinPct != null;

                const stateName = abbr ? STATE_NAMES[abbr] ?? abbr : "";
                // Mouse enter/leave is wired on every state with a known
                // abbreviation, so all of them get a hover fill swap. Whether a
                // tooltip appears is decided by `hoveredRace` below: present for
                // all three race kinds, absent for a state with no 2026 contest.
                const hoverHandlers = abbr
                  ? {
                      onMouseEnter: (e: MouseEvent<SVGPathElement>) =>
                        handleEnter(abbr, e),
                      onMouseLeave: handleLeave,
                    }
                  : {};
                const interactiveProps = canOpen
                  ? {
                      tabIndex: 0,
                      role: "button",
                      "aria-label": t("midtermsHubViewForecastAria", {
                        state: stateName,
                      }),
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
                      fill: isFilled ? fillColor : uncontestedHoverFill,
                      stroke: strokeColor,
                      strokeWidth: isFilled ? 2 : 1.5,
                      outline: "none",
                      cursor: canOpen ? "pointer" : "default",
                      opacity: isFilled ? 1 : UNCONTESTED_OPACITY_HOVER,
                      transition:
                        "fill 150ms ease-out, opacity 150ms ease-out, filter 150ms ease-out",
                      filter: isFilled ? "brightness(0.9)" : undefined,
                    }
                  : {
                      fill: fillColor,
                      stroke: strokeColor,
                      strokeWidth: 1.5,
                      outline: "none",
                      cursor: canOpen ? "pointer" : "default",
                      opacity: isFilled ? 1 : uncontestedOpacity,
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
            demWinPct={hoveredRace.demWinPct}
          />
        </MapTooltipPortal>
      )}
    </div>
  );
};

export default GeographicMap;

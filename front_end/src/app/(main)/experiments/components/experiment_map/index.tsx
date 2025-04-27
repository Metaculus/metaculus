"use client";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent,
} from "react";

import usePrevious from "@/hooks/use_previous";
import { BaseMapArea, MapType } from "@/types/experiments";
import cn from "@/utils/core/cn";

import RawMap from "./raw_map";

import "./styles.css";

type HoverCardRendererProps<T> = {
  x: number;
  y: number;
  mapArea: T;
  onMouseEnter?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: MouseEvent<HTMLDivElement>) => void;
};

type Props<T> = {
  mapType: MapType;
  mapAreas: T[];
  getMapAreaColor: (mapArea: T) => string | undefined;
  externalHoveredId?: string | null;
  onHover?: (id: string | null) => void;
  renderHoverPopover?: (props: HoverCardRendererProps<T | null>) => ReactNode;
  interactive?: boolean;
};

type HoverCard<T extends BaseMapArea> = {
  x: number;
  y: number;
  mapArea: T | null;
};

const ExperimentMap = <T extends BaseMapArea>({
  mapType,
  mapAreas,
  getMapAreaColor,
  onHover,
  renderHoverPopover,
  externalHoveredId,
  interactive = true,
}: Props<T>) => {
  const ref = useRef<SVGSVGElement>(null);
  const mapAreaDictionary = useMemo(
    () =>
      mapAreas.reduce<Record<string, T>>(
        (acc, el) => ({ ...acc, [el.abbreviation]: el }),
        {}
      ),
    [mapAreas]
  );
  const getMapArea = useCallback(
    (abbreviation: string) =>
      (mapAreaDictionary[abbreviation] ?? null) as T | null,
    [mapAreaDictionary]
  );

  const [hoveredMapArea, setHoveredMapArea] = useState<T | null>(null);
  const prevHoveredMapArea = usePrevious(hoveredMapArea);
  const [hoveredCard, setHoveredCard] = useState<HoverCard<T>>({
    x: 0,
    y: 0,
    mapArea: null,
  });
  // This keeps track if the mouse is over the popover card displayed when hovering cards. We show
  // this card when the mouse over the state path, but we want to keep showing it also when the
  // mouse moves to over this popover card, so we need to keep track of that info
  const isMouseOverCard = useRef<boolean>(false);
  // We use a timeout to delay the hiding of the popover card in order for the user to have the
  // chance of moving the mouse on top of it before it's hidden away
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const toggleHover = (mapArea: T, hovered: boolean) => {
      if (!ref.current) return;

      const areaPath = ref.current.getElementById(
        mapArea.abbreviation
      ) as SVGSVGElement;
      if (!areaPath) {
        return;
      }

      const svgBBox = ref.current.getBBox();
      const xScaleFactor = ref.current.clientWidth / svgBBox.width;
      const yScaleFactor = ref.current.clientHeight / svgBBox.height;

      const bbox = areaPath.getBBox();
      let x = bbox.x + bbox.width / 2 + (hoveredMapArea?.x_adjust ?? 0);
      let y = bbox.y + bbox.height / 2 + (hoveredMapArea?.y_adjust ?? 0);

      x *= xScaleFactor;
      y *= yScaleFactor;

      if (hovered) {
        areaPath.classList.add("hoveredMapArea");
        setHoveredCard({ x, y, mapArea });
      } else {
        areaPath.classList.remove("hoveredMapArea");
        setHoveredCard({ x: 0, y: 0, mapArea: null });
      }
    };

    if (hoveredMapArea) {
      toggleHover(hoveredMapArea, true);
    }

    if (
      prevHoveredMapArea &&
      prevHoveredMapArea.name !== hoveredMapArea?.name
    ) {
      toggleHover(prevHoveredMapArea, false);
    }
  }, [hoveredMapArea, prevHoveredMapArea]);
  const handleHoverCardMouseEnter = useCallback(() => {
    isMouseOverCard.current = true;
  }, []);
  const handleHoverCardMouseLeave = useCallback(() => {
    isMouseOverCard.current = false;
    setHoveredMapArea(null);
  }, []);
  useEffect(() => {
    if (externalHoveredId === undefined) return;

    if (externalHoveredId) {
      const mapArea = mapAreas.find(
        (area) => area.abbreviation === externalHoveredId
      );
      if (mapArea) {
        setHoveredMapArea(mapArea);
      }
    } else {
      setHoveredMapArea(null);
    }
  }, [mapAreas, externalHoveredId]);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const mapAreas = ref.current.querySelectorAll<SVGSVGElement>("#Areas");

    const cleanupData: {
      areaPath: SVGSVGElement;
      onMouseEnter: () => void;
      onMouseLeave: () => void;
      stateLabel: SVGTextElement;
    }[] = [];

    ref.current
      .querySelectorAll<SVGSVGElement>("#Areas path")
      .forEach((areaPath) => {
        const mapArea = getMapArea(areaPath.id);
        if (!mapArea) {
          return;
        }

        const onMouseEnter = () => {
          if (timer.current) {
            clearTimeout(timer.current);
          }
          setHoveredMapArea(mapArea);
          onHover?.(mapArea.abbreviation);
        };
        const onMouseLeave = () => {
          timer.current = setTimeout(() => {
            if (!isMouseOverCard.current) {
              setHoveredMapArea(null);
              onHover?.(null);
            }
          }, 50);
        };
        areaPath.addEventListener("mouseenter", onMouseEnter);
        areaPath.addEventListener("mouseleave", onMouseLeave);

        const color = getMapAreaColor(mapArea);
        if (color) {
          areaPath.style.fill = color;
        }

        const bbox = areaPath.getBBox();
        const x = bbox.x + bbox.width / 2 + mapArea.x_adjust;
        const y = bbox.y + bbox.height / 2 + mapArea.y_adjust;
        const stateLabel = createAreaLabelElement(mapArea, x, y);
        mapAreas[0]?.appendChild(stateLabel);
        stateLabel.addEventListener("mouseenter", onMouseEnter);
        stateLabel.addEventListener("mouseleave", onMouseLeave);
        cleanupData.push({ areaPath, onMouseEnter, onMouseLeave, stateLabel });
      });

    return () => {
      cleanupData.forEach(
        ({ areaPath, onMouseEnter, onMouseLeave, stateLabel }) => {
          areaPath.removeEventListener("mouseenter", onMouseEnter);
          areaPath.removeEventListener("mouseleave", onMouseLeave);
          stateLabel.removeEventListener("mouseenter", onMouseEnter);
          stateLabel.removeEventListener("mouseleave", onMouseLeave);
          mapAreas[0]?.removeChild(stateLabel);
        }
      );
    };
  }, [getMapAreaColor, getMapArea, onHover]);

  return (
    <div
      className={cn("relative flex flex-col items-center gap-10", {
        "pointer-events-none": !interactive,
      })}
    >
      <RawMap ref={ref} mapType={mapType} />
      {renderHoverPopover && hoveredCard.mapArea
        ? renderHoverPopover({
            x: hoveredCard.x,
            y: hoveredCard.y,
            mapArea: hoveredCard.mapArea,
            onMouseEnter: handleHoverCardMouseEnter,
            onMouseLeave: handleHoverCardMouseLeave,
          })
        : null}
    </div>
  );
};

const createAreaLabelElement = <T extends BaseMapArea>(
  state: T,
  x: number,
  y: number
) => {
  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textElement.setAttribute("id", state.abbreviation + "-text");

  textElement.setAttribute("text-anchor", "middle");
  textElement.setAttribute("alignment-baseline", "middle");
  textElement.classList.add("mapLabelText");
  textElement.textContent = state.abbreviation;
  textElement.setAttribute("x", "" + x);
  textElement.setAttribute("y", "" + y);

  return textElement;
};

export default ExperimentMap;

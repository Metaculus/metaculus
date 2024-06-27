"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import usePrevious from "@/hooks/use_previous";
import { BaseMapArea, MapType } from "@/types/experiments";

import RawMap from "./raw_map";

import "./styles.css";

type Props<T> = {
  mapType: MapType;
  mapAreas: T[];
  getMapAreaColor: (mapArea: T) => string | undefined;
  onHover?: (mapArea: T | null) => void;
};

const ExperimentMap = <T extends BaseMapArea>({
  mapType,
  mapAreas,
  getMapAreaColor,
  onHover,
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
  useEffect(() => {
    const toggleHover = (mapArea: T, hovered: boolean) => {
      if (!ref.current) return;

      const areaPath = ref.current.getElementById(
        mapArea.abbreviation
      ) as SVGSVGElement;
      if (!areaPath) {
        return;
      }

      if (hovered) {
        areaPath.classList.add("hoveredMapArea");
      } else {
        areaPath.classList.remove("hoveredMapArea");
      }
    };

    if (hoveredMapArea) {
      toggleHover(hoveredMapArea, true);
    }

    if (prevHoveredMapArea) {
      toggleHover(prevHoveredMapArea, false);
    }
  }, [hoveredMapArea, prevHoveredMapArea]);

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
          setHoveredMapArea(mapArea);
          onHover?.(mapArea);
        };
        const onMouseLeave = () => {
          setHoveredMapArea(null);
          onHover?.(null);
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
        mapAreas[0].appendChild(stateLabel);
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
          mapAreas[0].removeChild(stateLabel);
        }
      );
    };
  }, [getMapAreaColor, getMapArea, onHover]);

  return <RawMap ref={ref} mapType={mapType} />;
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

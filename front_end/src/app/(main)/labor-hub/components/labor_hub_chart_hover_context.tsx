"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

/** Chip / chip-group hover: emphasize min envelope (“decline”) or max envelope (“growth”) on the chart. */
export type LaborHubHighlightedEnvelope = "most" | "least";

type LaborHubChartHoverContextValue = {
  hoverYear: number | null;
  setHoverYear: (year: number | null) => void;
  highlightedEnvelope: LaborHubHighlightedEnvelope | null;
  setHighlightedEnvelope: (band: LaborHubHighlightedEnvelope | null) => void;
  hoveredActivityId: string | null;
  setHoveredActivityId: (activityId: string | null) => void;
};

const LaborHubChartHoverContext =
  createContext<LaborHubChartHoverContextValue | null>(null);

export function LaborHubChartHoverProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [highlightedEnvelope, setHighlightedEnvelope] =
    useState<LaborHubHighlightedEnvelope | null>(null);
  const [hoveredActivityId, setHoveredActivityIdState] = useState<string | null>(
    null
  );
  const hoveredActivityClearTimeoutRef = useRef<number | null>(null);
  const setHoveredActivityId = useCallback((activityId: string | null) => {
    if (hoveredActivityClearTimeoutRef.current !== null) {
      window.clearTimeout(hoveredActivityClearTimeoutRef.current);
      hoveredActivityClearTimeoutRef.current = null;
    }

    if (activityId !== null) {
      setHoveredActivityIdState(activityId);
      return;
    }

    // Preserve hover briefly so nearby SVG/card hover targets can hand off cleanly.
    hoveredActivityClearTimeoutRef.current = window.setTimeout(() => {
      setHoveredActivityIdState(null);
      hoveredActivityClearTimeoutRef.current = null;
    }, 40);
  }, []);

  useEffect(() => {
    return () => {
      if (hoveredActivityClearTimeoutRef.current !== null) {
        window.clearTimeout(hoveredActivityClearTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      hoverYear,
      setHoverYear,
      highlightedEnvelope,
      setHighlightedEnvelope,
      hoveredActivityId,
      setHoveredActivityId,
    }),
    [hoverYear, highlightedEnvelope, hoveredActivityId]
  );
  return (
    <LaborHubChartHoverContext.Provider value={value}>
      {children}
    </LaborHubChartHoverContext.Provider>
  );
}

export function useLaborHubChartHover(): LaborHubChartHoverContextValue | null {
  return useContext(LaborHubChartHoverContext);
}

/** Clears shared chart hover when the pointer leaves this section (e.g. entire overview row). */
export function LaborHubChartHoverSection({
  onMouseLeave,
  ...props
}: ComponentProps<"section">) {
  const ctx = useLaborHubChartHover();
  return (
    <section
      {...props}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        ctx?.setHoverYear(null);
        ctx?.setHighlightedEnvelope(null);
        ctx?.setHoveredActivityId(null);
      }}
    />
  );
}

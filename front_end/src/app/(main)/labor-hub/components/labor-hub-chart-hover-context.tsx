"use client";

import {
  createContext,
  useContext,
  useMemo,
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
  const value = useMemo(
    () => ({
      hoverYear,
      setHoverYear,
      highlightedEnvelope,
      setHighlightedEnvelope,
    }),
    [hoverYear, highlightedEnvelope]
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
      }}
    />
  );
}

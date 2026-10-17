"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { GhmValueKey } from "../../config/questions";

type LinkedTimelineContextValue = {
  activeKey: GhmValueKey;
  pinnedKey: GhmValueKey | null;
  setHoveredKey: (key: GhmValueKey | null) => void;
  setPinnedKey: (key: GhmValueKey | null) => void;
  // Keys that have a chart in the linked timeline; other tokens don't switch it.
  chartKeys: GhmValueKey[];
};

const LinkedTimelineContext = createContext<LinkedTimelineContextValue | null>(
  null
);

export function LinkedTimelineProvider({
  defaultKey,
  chartKeys,
  children,
}: {
  defaultKey: GhmValueKey;
  chartKeys: GhmValueKey[];
  children: ReactNode;
}) {
  const [hoveredKey, setHoveredKey] = useState<GhmValueKey | null>(null);
  const [pinnedKey, setPinnedKey] = useState<GhmValueKey | null>(null);

  const value = useMemo(
    () => ({
      activeKey: hoveredKey ?? pinnedKey ?? defaultKey,
      pinnedKey,
      setHoveredKey,
      setPinnedKey,
      chartKeys,
    }),
    [chartKeys, defaultKey, hoveredKey, pinnedKey]
  );

  return (
    <LinkedTimelineContext.Provider value={value}>
      {children}
    </LinkedTimelineContext.Provider>
  );
}

export function useLinkedTimeline(): LinkedTimelineContextValue | null {
  return useContext(LinkedTimelineContext);
}

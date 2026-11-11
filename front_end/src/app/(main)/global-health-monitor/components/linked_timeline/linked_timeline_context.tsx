"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { GhmValueKey } from "../../config/questions";

type LinkedTimelineContextValue = {
  activeKey: GhmValueKey;
  // The last hovered or clicked takeaway's lead; it stays until another takeaway takes over.
  select: (key: GhmValueKey) => void;
  // A hovered forecast token shows its own chart until the pointer leaves it.
  setPreviewKey: (key: GhmValueKey | null) => void;
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
  const [selectedKey, setSelectedKey] = useState<GhmValueKey>(defaultKey);
  const [previewKey, setPreviewKey] = useState<GhmValueKey | null>(null);

  const value = useMemo(
    () => ({
      activeKey: previewKey ?? selectedKey,
      select: setSelectedKey,
      setPreviewKey,
      chartKeys,
    }),
    [chartKeys, previewKey, selectedKey]
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

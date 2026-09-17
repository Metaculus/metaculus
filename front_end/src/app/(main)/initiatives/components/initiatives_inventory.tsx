"use client";

import { FC, useState, useSyncExternalStore } from "react";

import InventoryToolbar from "./inventory_toolbar";
import { InitiativesInventoryFilter, InitiativesInventoryView } from "../types";

type Props = {
  filters: InitiativesInventoryFilter[];
  initialFilterId: string;
};

const MOBILE_LIST_QUERY = "(max-width: 768px)";

const subscribeToViewport = (callback: () => void) => {
  const mediaQuery = window.matchMedia(MOBILE_LIST_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getMobileSnapshot = () => window.matchMedia(MOBILE_LIST_QUERY).matches;
const getServerSnapshot = () => false;

const InitiativesInventory: FC<Props> = ({ filters, initialFilterId }) => {
  const [activeFilterId, setActiveFilterId] = useState(initialFilterId);
  const [desktopView, setDesktopView] =
    useState<InitiativesInventoryView>("grid");
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getMobileSnapshot,
    getServerSnapshot
  );
  const view = isMobile ? "list" : desktopView;

  return (
    <InventoryToolbar
      filters={filters}
      activeFilterId={activeFilterId}
      onFilterChange={setActiveFilterId}
      view={view}
      onViewChange={setDesktopView}
    />
  );
};

export default InitiativesInventory;

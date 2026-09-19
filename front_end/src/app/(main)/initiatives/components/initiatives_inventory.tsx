"use client";

import { useTranslations } from "next-intl";
import { FC, useState, useSyncExternalStore } from "react";

import cn from "@/utils/core/cn";

import InitiativeInventoryCard from "./initiative_inventory_card";
import InventoryToolbar from "./inventory_toolbar";
import {
  Initiative,
  InitiativesInventoryFilter,
  InitiativesInventoryView,
} from "../types";

const RESULTS_ID = "initiatives-inventory-results";
const DESKTOP_VIEW_QUERY = "(min-width: 769px)";

type Props = {
  initiatives: Initiative[];
  filters: InitiativesInventoryFilter[];
  allFilterId: string;
};

const subscribeToViewport = (callback: () => void) => {
  const mediaQuery = window.matchMedia(DESKTOP_VIEW_QUERY);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getDesktopSnapshot = () => window.matchMedia(DESKTOP_VIEW_QUERY).matches;
const getServerSnapshot = () => true;

const InitiativesInventory: FC<Props> = ({
  initiatives,
  filters,
  allFilterId,
}) => {
  const t = useTranslations();
  const [activeFilterId, setActiveFilterId] = useState(allFilterId);
  const [desktopView, setDesktopView] =
    useState<InitiativesInventoryView>("grid");
  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    getDesktopSnapshot,
    getServerSnapshot
  );
  const view = isDesktop ? desktopView : "list";
  const visibleInitiatives = initiatives.filter(
    (initiative) =>
      activeFilterId === allFilterId || initiative.categoryId === activeFilterId
  );

  return (
    <>
      <InventoryToolbar
        filters={filters}
        activeFilterId={activeFilterId}
        onFilterChange={setActiveFilterId}
        view={view}
        onViewChange={setDesktopView}
        resultsId={RESULTS_ID}
      />
      <ul
        id={RESULTS_ID}
        className={cn(
          "m-0 mt-8 grid list-none grid-cols-1 gap-8 p-0",
          view === "grid" && "min-[769px]:grid-cols-2 xl:grid-cols-3"
        )}
      >
        {visibleInitiatives.map((initiative) => (
          <InitiativeInventoryCard
            key={initiative.id}
            initiative={initiative}
            view={view}
          />
        ))}
        {visibleInitiatives.length === 0 && (
          <li className="col-span-full py-12 text-center text-blue-700 dark:text-blue-700-dark">
            {t("noResults")}
          </li>
        )}
      </ul>
    </>
  );
};

export default InitiativesInventory;

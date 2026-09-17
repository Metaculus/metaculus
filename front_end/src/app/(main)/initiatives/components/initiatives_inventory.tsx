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

type Props = {
  initiatives: Initiative[];
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

const InitiativesInventory: FC<Props> = ({
  initiatives,
  filters,
  initialFilterId,
}) => {
  const t = useTranslations();
  const [activeFilterId, setActiveFilterId] = useState(initialFilterId);
  const [desktopView, setDesktopView] =
    useState<InitiativesInventoryView>("grid");
  const isMobile = useSyncExternalStore(
    subscribeToViewport,
    getMobileSnapshot,
    getServerSnapshot
  );
  const view = isMobile ? "list" : desktopView;
  const visibleInitiatives = initiatives.filter(
    (initiative) =>
      activeFilterId === initialFilterId ||
      initiative.categoryId === activeFilterId
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
          "m-0 mt-8 grid list-none grid-cols-1 gap-x-6 gap-y-10 p-0",
          view === "grid" && "md:grid-cols-2 xl:grid-cols-3"
        )}
      >
        {visibleInitiatives.map((initiative) => (
          <InitiativeInventoryCard
            key={initiative.id}
            initiative={initiative}
            view={view}
            categoryLabelKey={
              filters.find((filter) => filter.id === initiative.categoryId)
                ?.labelKey
            }
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

"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo, useRef, useState } from "react";

import InitiativeInventoryCard from "./initiative_inventory_card";
import InventoryCategoryCarousel from "./inventory_category_carousel";
import InventoryToolbar from "./inventory_toolbar";
import { DEFAULT_INITIATIVE_COLOR } from "../helpers/contrast";
import {
  Initiative,
  InitiativesInventoryFilter,
  InitiativesInventoryView,
} from "../types";

const RESULTS_ID = "initiatives-inventory-results";

type Props = {
  initiatives: Initiative[];
  filters: InitiativesInventoryFilter[];
  allFilterId: string;
};

const InitiativesInventory: FC<Props> = ({
  initiatives,
  filters,
  allFilterId,
}) => {
  const t = useTranslations();
  const [activeFilterId, setActiveFilterId] = useState(allFilterId);
  const [view, setView] = useState<InitiativesInventoryView>("grid");
  const rootRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isList = view === "list";

  const categoryColors = useMemo(
    () =>
      new Map(
        filters.flatMap(({ id, color }) =>
          color ? [[id, color] as const] : []
        )
      ),
    [filters]
  );
  const getColor = (categoryId?: string) =>
    (categoryId && categoryColors.get(categoryId)) || DEFAULT_INITIATIVE_COLOR;

  const categories = filters
    .filter(({ id }) => id !== allFilterId)
    .map((category) => ({
      category,
      items: initiatives.filter(({ categoryId }) => categoryId === category.id),
    }))
    .filter(({ items }) => items.length > 0);

  const visibleInitiatives = initiatives.filter(
    (initiative) =>
      activeFilterId === allFilterId || initiative.categoryId === activeFilterId
  );

  // Switching content under a stuck toolbar would leave the reader mid-page,
  // so jump back to where the section starts.
  const scrollToStartIfStuck = () => {
    const root = rootRef.current?.getBoundingClientRect();
    const toolbar = toolbarRef.current?.getBoundingClientRect();
    if (root && toolbar && root.top < toolbar.top - 1) {
      window.scrollBy({ top: root.top - toolbar.top });
    }
  };

  const handleFilterChange = (filterId: string) => {
    scrollToStartIfStuck();
    setActiveFilterId(filterId);
  };

  const handleViewChange = (nextView: InitiativesInventoryView) => {
    scrollToStartIfStuck();
    setView(nextView);
  };

  return (
    <div
      ref={rootRef}
      className="flow-root [--initiative-tile-gap:theme(colors.gray.0.DEFAULT)] dark:[--initiative-tile-gap:theme(colors.gray.0.dark)]"
    >
      <InventoryToolbar
        filters={filters}
        activeFilterId={activeFilterId}
        onFilterChange={handleFilterChange}
        view={view}
        onViewChange={handleViewChange}
        resultsId={RESULTS_ID}
        containerRef={toolbarRef}
      />

      {isList ? (
        <ul
          id={RESULTS_ID}
          className="m-0 grid list-none grid-cols-1 gap-3 p-0 pt-14 sm:pt-16"
        >
          {visibleInitiatives.map((initiative) => (
            <li key={initiative.id} className="min-w-0">
              <InitiativeInventoryCard
                initiative={initiative}
                color={getColor(initiative.categoryId)}
                view="list"
              />
            </li>
          ))}
          {visibleInitiatives.length === 0 && (
            <li className="py-12 text-center text-blue-700 dark:text-blue-700-dark">
              {t("noResults")}
            </li>
          )}
        </ul>
      ) : (
        <div id={RESULTS_ID} className="flex flex-col gap-12 md:gap-16">
          {categories.map(({ category, items }) => (
            <InventoryCategoryCarousel
              key={category.id}
              category={category}
              initiatives={items}
              color={getColor(category.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InitiativesInventory;

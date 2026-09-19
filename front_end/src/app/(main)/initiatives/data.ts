import rawInitiativesPageData from "./initiatives.json";
import {
  FeaturedInitiative,
  Initiative,
  InitiativePlacement,
  InitiativesInventoryFilter,
  InitiativesPageData,
} from "./types";

export const ALL_INITIATIVES_FILTER_ID = "all";

export const initiativesPageData =
  rawInitiativesPageData as InitiativesPageData;

export function getInitiativesByPlacement(
  placement: InitiativePlacement
): Initiative[] {
  return initiativesPageData.initiatives
    .filter((initiative) => initiative.placements.includes(placement))
    .sort((a, b) =>
      placement === "inventory"
        ? (a.inventoryOrder ?? a.order) - (b.inventoryOrder ?? b.order)
        : a.order - b.order
    );
}

export function getFeaturedInitiatives(): FeaturedInitiative[] {
  return initiativesPageData.initiatives
    .filter(
      (initiative): initiative is FeaturedInitiative =>
        initiative.placements.includes("featured") &&
        !!initiative.feature &&
        !!initiative.brand
    )
    .sort((a, b) => a.feature.order - b.feature.order);
}

export function getInventoryFilters(): InitiativesInventoryFilter[] {
  return [
    {
      id: ALL_INITIATIVES_FILTER_ID,
      labelKey: "initiativesInventoryFilterAll",
    },
    ...(initiativesPageData.categories ?? []),
  ];
}

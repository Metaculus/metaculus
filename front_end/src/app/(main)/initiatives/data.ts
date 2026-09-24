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

const categoryColors = new Map(
  (initiativesPageData.categories ?? []).map(({ id, color }) => [id, color])
);

const initiatives: Initiative[] = initiativesPageData.initiatives.map(
  (initiative) => {
    const categoryColor = initiative.categoryId
      ? categoryColors.get(initiative.categoryId)
      : undefined;

    return initiative.brand || !categoryColor
      ? initiative
      : { ...initiative, brand: { color: categoryColor } };
  }
);

export function getInitiativesByPlacement(
  placement: InitiativePlacement
): Initiative[] {
  return initiatives
    .filter((initiative) => initiative.placements.includes(placement))
    .sort((a, b) =>
      placement === "inventory"
        ? (a.inventoryOrder ?? a.order) - (b.inventoryOrder ?? b.order)
        : a.order - b.order
    );
}

export function getFeaturedInitiatives(): FeaturedInitiative[] {
  return initiatives
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

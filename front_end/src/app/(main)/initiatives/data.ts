import rawInitiativesPageData from "./initiatives.json";
import {
  FeaturedInitiative,
  Initiative,
  InitiativePlacement,
  InitiativesPageData,
} from "./types";

export const initiativesPageData =
  rawInitiativesPageData as InitiativesPageData;

export function getInitiativesByPlacement(
  placement: InitiativePlacement
): Initiative[] {
  return initiativesPageData.initiatives
    .filter((initiative) => initiative.placements.includes(placement))
    .sort((a, b) => a.order - b.order);
}

export function getFeaturedInitiatives(): FeaturedInitiative[] {
  return initiativesPageData.initiatives
    .filter(
      (initiative): initiative is FeaturedInitiative =>
        initiative.placements.includes("featured") && !!initiative.feature
    )
    .sort((a, b) => a.feature.order - b.feature.order);
}

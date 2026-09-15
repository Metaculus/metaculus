import rawInitiativesPageData from "./initiatives.json";
import { Initiative, InitiativePlacement, InitiativesPageData } from "./types";

export const initiativesPageData =
  rawInitiativesPageData as InitiativesPageData;

export function getInitiativesByPlacement(
  placement: InitiativePlacement
): Initiative[] {
  return initiativesPageData.initiatives
    .filter((initiative) => initiative.placements.includes(placement))
    .sort((a, b) => a.order - b.order);
}

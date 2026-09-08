import { CombinedFeedTile, TilePlacement } from "@/types/projects";

export function getPageNumberFromParam(pageNumberParam: string | null) {
  const pageNumber = Number(pageNumberParam);

  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
}

export function seededRandom(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >>> 0) / 0x80000000;
  };
}

// Auto-generated project tiles carry no admin-controlled placement, so they stay on
// the two surfaces they shipped with.
const PROJECT_TILE_PLACEMENTS: TilePlacement[] = [
  TilePlacement.QUESTIONS_FEED,
  TilePlacement.QUESTION_SIDEBAR,
];

export function filterTilesByPlacement(
  tiles: CombinedFeedTile[],
  placement: TilePlacement
): CombinedFeedTile[] {
  return tiles.filter((tile) => {
    if (tile.type !== "ad") {
      return PROJECT_TILE_PLACEMENTS.includes(placement);
    }

    // A tab open across the deploy can hold a payload cached before `placements`
    // shipped; treat those ads as legacy-placed rather than hiding them for a minute.
    const { placements } = tile.ad;
    return Array.isArray(placements)
      ? placements.includes(placement)
      : PROJECT_TILE_PLACEMENTS.includes(placement);
  });
}

import { PostWithForecasts } from "@/types/post";
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

    if (isTargetedTile(tile) && placement !== TilePlacement.QUESTION_SIDEBAR) {
      return false;
    }

    // A tab open across the deploy can hold a payload cached before `placements`
    // shipped; treat those ads as legacy-placed rather than hiding them for a minute.
    const { placements } = tile.ad;
    return Array.isArray(placements)
      ? placements.includes(placement)
      : PROJECT_TILE_PLACEMENTS.includes(placement);
  });
}

// `!= null` also covers payloads cached before the target fields shipped.
function isTargetedTile(tile: CombinedFeedTile): boolean {
  return (
    tile.type === "ad" &&
    (tile.ad.target_post_id != null || tile.ad.target_project_id != null)
  );
}

function getPostProjectIds(post: PostWithForecasts): Set<number> {
  const { default_project, ...groups } = post.projects ?? {};
  const ids = new Set<number>();
  if (default_project) ids.add(default_project.id);
  for (const projects of Object.values(groups)) {
    for (const project of projects ?? []) ids.add(project.id);
  }
  return ids;
}

/**
 * Drops ads targeted at other posts/projects and orders the rest:
 * post-targeted, then project-targeted, then untargeted (stable within each group).
 */
export function prioritizeTilesForPost(
  tiles: CombinedFeedTile[],
  post: PostWithForecasts
): CombinedFeedTile[] {
  const projectIds = getPostProjectIds(post);
  const rank = (tile: CombinedFeedTile): number | null => {
    if (tile.type !== "ad") return 2;
    const { target_post_id, target_project_id } = tile.ad;
    if (target_post_id != null) return target_post_id === post.id ? 0 : null;
    if (target_project_id != null) {
      return projectIds.has(target_project_id) ? 1 : null;
    }
    return 2;
  };

  return tiles
    .map((tile) => ({ tile, rank: rank(tile) }))
    .filter(
      (item): item is { tile: CombinedFeedTile; rank: number } =>
        item.rank !== null
    )
    .sort((a, b) => a.rank - b.rank)
    .map(({ tile }) => tile);
}

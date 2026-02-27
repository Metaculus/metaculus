import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { PostWithForecasts } from "@/types/post";
import { FeedProjectTile } from "@/types/projects";

export type FeedItem =
  | { type: "post"; post: PostWithForecasts }
  | { type: "project"; tile: FeedProjectTile };

function seededRandom(seed: number): () => number {
  let s = seed | 0 || 1;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s >>> 0) / 0x80000000;
  };
}

export type RankedFeedProjectTile = FeedProjectTile & { rank: number };

export function mergeFeedItems(
  posts: PostWithForecasts[],
  tiles: RankedFeedProjectTile[]
): FeedItem[] {
  if (!tiles.length) {
    return posts.map((post) => ({ type: "post", post }));
  }
  if (!posts.length) {
    return tiles.map((tile) => ({ type: "project", tile }));
  }

  // Only include projects whose rank (pre-weighted) beats the last post's rank.
  // As more posts load (with lower ranks), more projects become eligible.
  const lastPostRank = posts[posts.length - 1]?.rank ?? 0;
  const eligibleTiles = tiles.filter((tile) => tile.rank >= lastPostRank);

  if (!eligibleTiles.length) {
    return posts.map((post) => ({ type: "post", post }));
  }

  const items: FeedItem[] = [];
  let pi = 0;
  let ti = 0;
  let lastWasProject = false;

  while (pi < posts.length || ti < eligibleTiles.length) {
    const postRank = pi < posts.length ? (posts[pi]!.rank ?? 0) : -1;
    const tileRank = ti < eligibleTiles.length ? eligibleTiles[ti]!.rank : -1;

    // Always insert a post between consecutive projects
    const forcePost = lastWasProject && pi < posts.length;

    if (forcePost || postRank >= tileRank) {
      items.push({ type: "post", post: posts[pi]! });
      pi++;
      lastWasProject = false;
    } else {
      items.push({ type: "project", tile: eligibleTiles[ti]! });
      ti++;
      lastWasProject = true;
    }
  }

  return items;
}

export function buildFeedItems(
  posts: PostWithForecasts[],
  tiles: FeedProjectTile[]
): FeedItem[] {
  if (!tiles.length || !posts.length) {
    return posts.map((post) => ({ type: "post", post }));
  }

  const seed =
    posts.slice(0, 10).reduce((acc, p) => acc + p.id, 0) +
    Math.floor(Date.now() / 86_400_000);
  const rand = seededRandom(seed);

  // Compute insertion positions (post indices AFTER which a tile appears)
  const insertAfter: number[] = [];
  let tileIdx = 0;

  // First tile: after post at index 1..4 (positions 2-5)
  const firstSlot = 1 + Math.floor(rand() * 4);
  if (tileIdx < tiles.length) {
    insertAfter.push(Math.min(firstSlot, posts.length - 1));
    tileIdx++;
  }

  // Subsequent tiles: every ~10 posts with +-2 jitter, at least 1 post apart
  while (tileIdx < tiles.length) {
    const lastSlot = insertAfter[insertAfter.length - 1] ?? 0;
    const base = lastSlot + POSTS_PER_PAGE;
    const jitter = Math.floor(rand() * 5) - 2;
    const slot = Math.max(base + jitter, lastSlot + 1);

    if (slot >= posts.length) break;

    insertAfter.push(slot);
    tileIdx++;
  }

  const tileAtIndex = new Map<number, FeedProjectTile>();
  insertAfter.forEach((slot, i) => {
    const tile = tiles[i];
    if (tile) tileAtIndex.set(slot, tile);
  });

  const items: FeedItem[] = [];
  posts.forEach((post, i) => {
    items.push({ type: "post", post });
    const tile = tileAtIndex.get(i);
    if (tile) {
      items.push({ type: "project", tile });
    }
  });

  return items;
}

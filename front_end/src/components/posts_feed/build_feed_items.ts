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
    return (s >>> 0) / 0x7fffffff;
  };
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

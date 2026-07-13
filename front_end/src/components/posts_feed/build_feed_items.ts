import { FEED_TILE_SPACING } from "@/constants/posts_feed";
import { PostWithForecasts } from "@/types/post";
import { CombinedFeedTile } from "@/types/projects";
import { seededRandom } from "@/utils/posts_feed";

export type FeedItem =
  | { type: "post"; post: PostWithForecasts }
  | { type: "tile"; tile: CombinedFeedTile };

export function getFeedItemKey(item: FeedItem) {
  return item.type === "tile" ? item.tile.id : `post-${item.post.id}`;
}

const postItemCache = new WeakMap<PostWithForecasts, FeedItem>();
const tileItemCache = new WeakMap<CombinedFeedTile, FeedItem>();

function getPostItem(post: PostWithForecasts): FeedItem {
  let item = postItemCache.get(post);
  if (!item) {
    item = { type: "post", post };
    postItemCache.set(post, item);
  }
  return item;
}

function getTileItem(tile: CombinedFeedTile): FeedItem {
  let item = tileItemCache.get(tile);
  if (!item) {
    item = { type: "tile", tile };
    tileItemCache.set(tile, item);
  }
  return item;
}

export function buildFeedItems(
  posts: PostWithForecasts[],
  tiles: CombinedFeedTile[]
): FeedItem[] {
  if (!tiles.length || !posts.length) {
    return posts.map((post) => getPostItem(post));
  }

  const seed =
    posts.slice(0, 10).reduce((acc, p) => acc + p.id, 0) +
    Math.floor(Date.now() / 86_400_000);
  const rand = seededRandom(seed);

  // Filter ad tiles by exposure_rate using the seeded rand; project tiles always show
  const eligibleTiles = tiles.filter((tile) => {
    if (tile.type !== "ad") return true;
    return rand() * 100 < tile.ad.exposure_rate;
  });

  if (!eligibleTiles.length) {
    return posts.map((post) => getPostItem(post));
  }

  // Compute insertion positions (post indices AFTER which a tile appears)
  const insertAfter: number[] = [];
  let tileIdx = 0;

  // First tile: after post at index 1..4 (positions 2-5)
  const firstSlot = 1 + Math.floor(rand() * 4);
  if (tileIdx < eligibleTiles.length) {
    insertAfter.push(Math.min(firstSlot, posts.length - 1));
    tileIdx++;
  }

  // Subsequent tiles: every ~10 posts with +-2 jitter, at least 1 post apart
  while (tileIdx < eligibleTiles.length) {
    const lastSlot = insertAfter[insertAfter.length - 1] ?? 0;
    const base = lastSlot + FEED_TILE_SPACING;
    const jitter = Math.floor(rand() * 5) - 2;
    const slot = Math.max(base + jitter, lastSlot + 1);

    if (slot >= posts.length) break;

    insertAfter.push(slot);
    tileIdx++;
  }

  const tileAtIndex = new Map<number, CombinedFeedTile>();
  insertAfter.forEach((slot, i) => {
    const tile = eligibleTiles[i];
    if (tile) tileAtIndex.set(slot, tile);
  });

  const items: FeedItem[] = [];
  posts.forEach((post, i) => {
    items.push(getPostItem(post));
    const tile = tileAtIndex.get(i);
    if (tile) {
      items.push(getTileItem(tile));
    }
  });

  return items;
}

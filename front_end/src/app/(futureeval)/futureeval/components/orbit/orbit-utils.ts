import { CarouselChip } from "./orbit-auto-carousel";
import {
  BOT_TOURNAMENTS_CHIPS,
  MODEL_BENCHMARK_CHIPS,
  OrbitItem,
} from "./orbit-constants";

/**
 * Get carousel chips based on orbit item type
 */
export function getCarouselChips(itemId: string): CarouselChip[] {
  switch (itemId) {
    case "model-benchmark":
      return MODEL_BENCHMARK_CHIPS;
    case "bot-tournaments":
      return BOT_TOURNAMENTS_CHIPS;
    default:
      return [];
  }
}

/**
 * Get the link text and href based on orbit item type
 */
export function getLinkInfo(
  item: OrbitItem
): { text: string; href: string } | null {
  switch (item.id) {
    case "model-benchmark":
      return { text: "View Leaderboard →", href: `#${item.action.target}` };
    case "bot-tournaments":
      return {
        text: "View Tournaments →",
        href: `${item.action.tabHref}#${item.action.target}`,
      };
    case "minibench":
      return { text: "Visit MiniBench →", href: item.action.target };
    default:
      return null;
  }
}

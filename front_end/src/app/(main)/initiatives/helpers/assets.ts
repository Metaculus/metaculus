export const INITIATIVE_FALLBACK_ARTWORK =
  "/images/initiatives/inventory-fallback.png";

export function resolveAssetSource(src: string): {
  src: string;
  unoptimized: boolean;
} {
  return { src, unoptimized: /^https?:\/\//i.test(src) };
}

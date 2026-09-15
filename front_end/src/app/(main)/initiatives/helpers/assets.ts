export function resolveAssetSource(src: string): {
  src: string;
  unoptimized: boolean;
} {
  return { src, unoptimized: /^https?:\/\//i.test(src) };
}

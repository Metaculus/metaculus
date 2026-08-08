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

export function getPageNumberFromParam(pageNumberParam: string | null) {
  const pageNumber = Number(pageNumberParam);

  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
}

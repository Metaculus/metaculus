const ONE_WEEK = 7 * 24 * 3600;

export function computeIndexDeltaFromSeries(
  line: { x: number; y: number }[] | undefined,
  periodSec = ONE_WEEK
): { latest: number; prev: number; delta: number } {
  if (!line || line.length === 0) {
    return { latest: 0, prev: 0, delta: 0 };
  }

  const latestPt = line[line.length - 1] ?? { x: 0, y: 0 };
  const cutoffTs = latestPt.x - periodSec;
  const prevPt = [...line].reverse().find((p) => p.x <= cutoffTs) ?? line[0];

  const latest = Number(latestPt.y ?? 0) || 0;
  const prev = Number(prevPt?.y ?? latest) || 0;

  const delta = Number((latest - prev).toFixed(1));

  return { latest, prev, delta };
}

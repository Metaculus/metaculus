import { EditionMarker } from "../helpers/snapshot";

const WIDTH = 240;
const HEIGHT = 44;
const PADDING = 3;

export function ForecastSparkline({
  points,
  markers = [],
  activeSlug,
}: {
  points: [number, number][];
  markers?: EditionMarker[];
  activeSlug?: string;
}) {
  if (points.length < 2) {
    return null;
  }

  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const rawMin = Math.min(...ys);
  const rawMax = Math.max(...ys);
  const spread = rawMax - rawMin || Math.abs(rawMax) * 0.1 || 1;
  const yMin = rawMin - spread * 0.15;
  const yMax = rawMax + spread * 0.15;

  const scaleX = (x: number) =>
    PADDING + ((x - xMin) / (xMax - xMin || 1)) * (WIDTH - PADDING * 2);
  const scaleY = (y: number) =>
    HEIGHT - PADDING - ((y - yMin) / (yMax - yMin)) * (HEIGHT - PADDING * 2);

  const path = points
    .map(([x, y], index) => {
      const px = scaleX(x).toFixed(1);
      const py = scaleY(y).toFixed(1);
      if (index === 0) {
        return `M${px},${py}`;
      }
      const previousY = scaleY(points[index - 1]?.[1] ?? y).toFixed(1);
      return `L${px},${previousY} L${px},${py}`;
    })
    .join(" ");

  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-11 w-full overflow-visible"
      aria-hidden
    >
      {markers
        .filter(({ timestamp }) => timestamp >= xMin && timestamp <= xMax)
        .map((marker) => (
          <line
            key={marker.slug}
            x1={scaleX(marker.timestamp)}
            x2={scaleX(marker.timestamp)}
            y1={0}
            y2={HEIGHT}
            strokeDasharray="2 3"
            className={
              marker.slug === activeSlug
                ? "stroke-purple-700 dark:stroke-purple-700-dark"
                : "stroke-purple-400 dark:stroke-purple-400-dark"
            }
          />
        ))}
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        className="stroke-blue-700 dark:stroke-blue-700-dark"
      />
      {lastPoint && (
        <circle
          cx={scaleX(lastPoint[0])}
          cy={scaleY(lastPoint[1])}
          r={2.5}
          className="fill-blue-700 dark:fill-blue-700-dark"
        />
      )}
    </svg>
  );
}

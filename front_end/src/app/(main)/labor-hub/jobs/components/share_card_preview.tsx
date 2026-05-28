import { type WallYear } from "../helpers/wall_types";

type Props = {
  jobName: string;
  forecasts: Record<WallYear, number | null>;
  forecasterCount?: number | null;
};

const BG = "#283441";
const TEXT_LIGHT = "#d7e7f7";
const TEXT_MUTED = "#a9c0d6";
const GREEN = "#19d8a2";
const RED = "#ff4642";
const GRAY = "#c8ccce";

const SANS = "'Inter', system-ui, -apple-system, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

function valueColor(value: number | null): string {
  if (value == null) return GRAY;
  if (value > 0) return GREEN;
  if (value < 0) return RED;
  return TEXT_LIGHT;
}

/**
 * Self-contained SVG share card (1.91:1 / 1200×630). All styling is inline so
 * the element can be serialized standalone and rasterized to PNG client-side.
 * The 2035 community forecast renders as a faint full-width line behind the
 * big headline number.
 */
export function ShareCardPreview({
  jobName,
  forecasts,
  forecasterCount,
}: Props) {
  const value = forecasts["2035"];
  const accent = valueColor(value);

  // Faint background forecast line.
  const rawPoints = [
    { year: 2025, value: 0 },
    { year: 2027, value: forecasts["2027"] },
    { year: 2030, value: forecasts["2030"] },
    { year: 2035, value: forecasts["2035"] },
  ];
  const points = rawPoints.filter(
    (p): p is { year: number; value: number } => p.value != null
  );

  const CX0 = 60;
  const CX1 = 1140;
  const CY_TOP = 110;
  const CY_BOTTOM = 540;
  const vMin = Math.min(0, ...points.map((p) => p.value));
  const vMax = Math.max(0, ...points.map((p) => p.value));
  const vRange = Math.max(vMax - vMin, 5);
  const xFor = (yr: number) => CX0 + ((yr - 2025) / 10) * (CX1 - CX0);
  const yFor = (v: number) =>
    CY_BOTTOM - ((v - vMin) / vRange) * (CY_BOTTOM - CY_TOP);
  const polyline = points
    .map((p) => `${xFor(p.year)},${yFor(p.value)}`)
    .join(" ");

  // Per-value coloring: baseline (0) gray, positive green, negative red.
  const pointColor = (v: number) => (v > 0 ? GREEN : v < 0 ? RED : GRAY);
  const lineGradientId = "lh-share-forecast-line";
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const firstX = firstPoint ? xFor(firstPoint.year) : 0;
  const lastX = lastPoint ? xFor(lastPoint.year) : 1;
  const lineSpan = lastX - firstX || 1;

  return (
    <svg
      viewBox="0 0 1200 630"
      className="block h-auto w-full"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${jobName}: ${formatPercent(value)} by 2035`}
    >
      <defs>
        {points.length > 1 && (
          <linearGradient
            id={lineGradientId}
            gradientUnits="userSpaceOnUse"
            x1={firstX}
            y1="0"
            x2={lastX}
            y2="0"
          >
            {points.map((p) => (
              <stop
                key={p.year}
                offset={`${(((xFor(p.year) - firstX) / lineSpan) * 100).toFixed(2)}%`}
                stopColor={pointColor(p.value)}
              />
            ))}
          </linearGradient>
        )}
      </defs>

      <rect x="0" y="0" width="1200" height="630" fill={BG} />

      {/* Dashed horizontal gridlines */}
      <g opacity="0.22">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const gy = CY_TOP + f * (CY_BOTTOM - CY_TOP);
          return (
            <line
              key={f}
              x1={CX0}
              x2={CX1}
              y1={gy}
              y2={gy}
              stroke={TEXT_MUTED}
              strokeWidth="2"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Faint forecast line behind everything — colored per value */}
      {points.length > 1 && (
        <g opacity="0.28">
          <polyline
            points={polyline}
            fill="none"
            stroke={`url(#${lineGradientId})`}
            strokeWidth="9"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p) => (
            <circle
              key={p.year}
              cx={xFor(p.year)}
              cy={yFor(p.value)}
              r="11"
              fill={pointColor(p.value)}
            />
          ))}
        </g>
      )}

      {/* Eyebrow */}
      <text
        x="60"
        y="92"
        fontFamily={SANS}
        fontSize="26"
        fontWeight="600"
        letterSpacing="2"
        fill={TEXT_MUTED}
      >
        METACULUS · LABOR AUTOMATION HUB
      </text>

      {/* Hero number */}
      <text
        x="60"
        y="380"
        fontFamily={MONO}
        fontSize="200"
        fontWeight="800"
        fill={accent}
      >
        {formatPercent(value)}
      </text>

      {/* Headline */}
      <text
        x="62"
        y="470"
        fontFamily={SANS}
        fontSize="52"
        fontWeight="600"
        fill={TEXT_LIGHT}
      >
        {jobName}, by 2035
      </text>

      {/* Footer */}
      <text x="60" y="580" fontFamily={SANS} fontSize="26" fill={TEXT_MUTED}>
        {forecasterCount != null
          ? `Median of ${forecasterCount} forecasters`
          : "Live community forecast"}
      </text>
      <text
        x="1140"
        y="580"
        textAnchor="end"
        fontFamily={SANS}
        fontSize="26"
        fontWeight="700"
        fill={TEXT_LIGHT}
      >
        metaculus.com/labor-hub
      </text>
    </svg>
  );
}

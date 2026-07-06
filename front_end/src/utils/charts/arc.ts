type Point = { x: number; y: number };

export type ArcDescription = {
  path: string;
  endPoint: Point;
  angle: number;
};

/**
 * Builds an SVG arc path for a radial (semicircular) gauge. The gauge sweeps
 * `arcAngle` radians in total; `percentage` (0–100) sets how far along that
 * sweep the arc ends. The large-arc-flag is derived from the actual swept
 * angle (> 180°) rather than the raw percentage, so it stays correct for
 * gauges whose total sweep exceeds π.
 */
export function describeArc({
  percentage,
  arcAngle,
  center,
  radius,
}: {
  percentage: number;
  arcAngle: number;
  center: Point;
  radius: number;
}): ArcDescription {
  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const sweptAngle = (percentage / 100) * arcAngle;
  const endAngle = startAngle + sweptAngle;
  const largeArcFlag = sweptAngle > Math.PI ? 1 : 0;

  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);

  return {
    path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
    endPoint: { x: endX, y: endY },
    angle: endAngle,
  };
}

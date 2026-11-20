import { BENCHMARK_POINTS, REFERENCE_LINES } from "./benchmark-points.mock";
import {
  computeLabelLayout,
  type PlacedLabel,
} from "../collision-aware-labels";
import { rectsOverlap } from "../helpers";
import { computeSotaPoints } from "../sota-trend";

// Chart widths for 320, 375 and 414px phones, then tablet and desktop.
const PHONE_CHART_WIDTHS = [288, 343, 382];
const WIDE_CHART_WIDTHS = [704, 881, 1044];

const points = BENCHMARK_POINTS.map(([name, releaseDate, score]) => ({
  x: +new Date(releaseDate),
  y: score,
  name,
}));
const sotaKeys = new Set(
  computeSotaPoints(points).map((point) => `${point.x}-${point.y}`)
);
const sotaNames = points
  .filter((point) => sotaKeys.has(`${point.x}-${point.y}`))
  .map((point) => point.name);

// Mirrors the geometry BenchmarkChart uses below and above the sm breakpoint.
function layoutAt(chartWidth: number, hoveredName?: string): PlacedLabel[] {
  const isSmallScreen = chartWidth < 640;
  const xValues = points.map((point) => point.x);
  const yValues = [
    ...points.map((point) => point.y),
    ...REFERENCE_LINES.map((line) => line.y),
  ];
  return computeLabelLayout({
    data: points.map((point) => {
      const isSota = sotaKeys.has(`${point.x}-${point.y}`);
      return {
        ...point,
        label: point.name,
        family: undefined,
        pointKey: point.name,
        showLabel: isSota,
        isHighlighted: true,
        isSota,
        isHoveredPoint: point.name === hoveredName,
      };
    }),
    referenceLines: REFERENCE_LINES,
    xDomain: [Math.min(...xValues), Math.max(...xValues)],
    yDomain: [Math.min(...yValues), Math.max(...yValues)],
    colorForFamily: () => "#000",
    padding: isSmallScreen
      ? { top: 30, bottom: 80, left: 35, right: 0 }
      : { top: 30, bottom: 80, left: 50, right: 30 },
    chartWidth,
    chartHeight: isSmallScreen ? 460 : 600,
    domainPadding: { x: isSmallScreen ? 10 : 25, y: 20 },
    labelFontSize: isSmallScreen ? 10 : 12,
  });
}

function overlappingPairs(labels: PlacedLabel[]): string[] {
  return labels.flatMap((label, index) =>
    labels
      .slice(index + 1)
      .filter((other) => rectsOverlap(label.rect, other.rect, 0))
      .map((other) => `${label.name} / ${other.name}`)
  );
}

describe("computeLabelLayout", () => {
  beforeAll(() => {
    // jsdom has no canvas, so text widths use the per-character estimate.
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it.each([...PHONE_CHART_WIDTHS, ...WIDE_CHART_WIDTHS])(
    "never draws two labels on top of each other at %ipx",
    (chartWidth) => {
      expect(overlappingPairs(layoutAt(chartWidth))).toEqual([]);
    }
  );

  it.each([...PHONE_CHART_WIDTHS, ...WIDE_CHART_WIDTHS])(
    "labels every frontier model at %ipx",
    (chartWidth) => {
      const names = layoutAt(chartWidth).map((label) => label.name);
      expect(names.sort()).toEqual([...sotaNames].sort());
    }
  );

  it.each(PHONE_CHART_WIDTHS)(
    "adds a hovered point's label without moving the others at %ipx",
    (chartWidth) => {
      const before = layoutAt(chartWidth);
      const hovered = layoutAt(chartWidth, "Gemini 3.7 Flash");

      expect(hovered.map((label) => label.name)).toContain("Gemini 3.7 Flash");
      expect(
        hovered.filter((label) => label.name !== "Gemini 3.7 Flash")
      ).toEqual(before);
    }
  );

  it("keeps the layout unchanged when hovering an already-labeled point", () => {
    expect(layoutAt(343, "Claude Opus 5 High")).toEqual(layoutAt(343));
  });
});

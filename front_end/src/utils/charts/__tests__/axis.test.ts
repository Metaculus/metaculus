import { ScaleDirection } from "@/types/charts";
import { QuestionType } from "@/types/question";
import { unscaleNominalLocation } from "@/utils/math";

import {
  generateScale,
  generateTimeSeriesYDomain,
  restrictScaleTicksToDomain,
  widenDomainToTicks,
} from "../axis";

describe("generateScale", () => {
  describe("numeric scale", () => {
    it("should generate basic numeric scale with default domain", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      expect(scale.ticks).toBeDefined();
      expect(scale.tickFormat).toBeDefined();
      expect(scale.cursorFormat).toBeDefined();

      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(0);
        expect(tick).toBeLessThanOrEqual(1);
      });

      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.tickFormat && scale.cursorFormat) {
        expect(typeof scale.tickFormat(firstTick)).toBe("string");
        expect(typeof scale.cursorFormat(firstTick)).toBe("string");
      }
    });

    it("should respect custom domain", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        domain: [0, 40] as [number, number],
        zoomedDomain: [10, 20] as [number, number],
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(10);
        expect(tick).toBeLessThanOrEqual(20);
      });
    });

    it("should append unit to tick labels when provided", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        unit: "%",
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.tickFormat) {
        const label = scale.tickFormat(firstTick, 0);
        expect(label).toContain("%");
      }
    });
  });

  describe("discrete scale", () => {
    it("uses five round labels on vertical discrete timelines", () => {
      const scale = generateScale({
        displayType: QuestionType.Discrete,
        axisLength: 151,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: -0.005,
          range_max: 8.205,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "0",
        "2",
        "4",
        "6",
        "8",
      ]);
    });

    it("does not place nice discrete ticks outside the forecast range", () => {
      const scale = generateScale({
        displayType: QuestionType.Discrete,
        axisLength: 151,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: 0.1,
          range_max: 4.9,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "1",
        "2",
        "3",
        "4",
      ]);
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(0);
        expect(tick).toBeLessThanOrEqual(1);
      });
    });

    it("shifts five nice ticks inside a discrete forecast range when possible", () => {
      const scale = generateScale({
        displayType: QuestionType.Discrete,
        axisLength: 151,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0.8, 1],
        scaling: {
          range_min: -0.005,
          range_max: 8.205,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "6",
        "6.5",
        "7",
        "7.5",
        "8",
      ]);
    });

    it("should generate discrete scale with inbound outcome count", () => {
      // Given
      const params = {
        displayType: QuestionType.Discrete,
        axisLength: 200,
        inboundOutcomeCount: 3,
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      expect(scale.ticks.length).toBeGreaterThan(0);
      // For discrete scale with 3 outcomes, we expect values between -0.5 and 1.5
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(-0.5);
        expect(tick).toBeLessThanOrEqual(1.5);
      });
    });

    it("should handle forced tick count", () => {
      // Given
      const forcedCount = 5;
      const params = {
        displayType: QuestionType.Discrete,
        axisLength: 200,
        forceTickCount: forcedCount,
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      expect(scale.ticks.length).toBe(forcedCount);
    });
  });

  describe("axis length behavior", () => {
    it("should generate fewer ticks for small axis length", () => {
      // Given
      const smallParams = {
        displayType: QuestionType.Numeric,
        axisLength: 50,
      } as const;
      const largeParams = {
        displayType: QuestionType.Numeric,
        axisLength: 500,
      } as const;

      // When
      const smallScale = generateScale(smallParams);
      const largeScale = generateScale(largeParams);

      // Then
      expect(smallScale.ticks.length).toBeLessThan(largeScale.ticks.length);
    });

    it("should handle vertical direction", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
      };

      // When
      const scale = generateScale(params);

      // Then
      expect(scale.ticks).toBeDefined();
      expect(scale.tickFormat).toBeDefined();
      expect(scale.ticks.length).toBeGreaterThan(0);
    });
  });

  describe("scaling behavior", () => {
    it("should apply custom scaling", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        scaling: {
          range_min: 0,
          range_max: 100,
          zero_point: 50,
        },
      } as const;

      // When
      const scale = generateScale(params);

      // Then
      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.cursorFormat) {
        const label = scale.cursorFormat(firstTick);
        expect(label).toBeDefined();
        expect(typeof label).toBe("string");
      }
    });
  });

  describe("fan graph ticks", () => {
    it("tick format should return a valid string for at least 3 ticks", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        scaling: {
          range_min: 50000000,
          range_max: 20000000000,
          zero_point: 0,
        },
        domain: [0, 1] as [number, number],
        zoomedDomain: [0.27264762227152306, 0.8262996659589331] as [
          number,
          number,
        ],
        direction: ScaleDirection.Vertical,
      };

      // When
      const scale = generateScale(params);

      // Then
      const formattedLabels = scale.ticks
        .map((tick) => scale.tickFormat(tick))
        .filter((label) => label !== "");
      expect(formattedLabels.length).toBeGreaterThan(2);
    });

    it("picks nice display labels on positive log axes", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: 1,
          range_max: 52.7,
          zero_point: 0,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });
      const labels = scale.ticks.map((tick) => scale.tickFormat(tick));
      const visualGaps = scale.ticks
        .slice(1)
        .map((tick, index) => tick - (scale.ticks[index] as number));

      expect(scale.ticks).toHaveLength(5);
      expect(labels).toEqual(["1", "2.5", "8", "20", "52.7"]);
      expect(scale.ticks[0]).toBeLessThanOrEqual(0);
      expect(scale.ticks.at(-1)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...visualGaps) / Math.min(...visualGaps)).toBeLessThan(
        1.45
      );
      labels
        .map(Number)
        .forEach((value) => expect(Number.isFinite(value)).toBe(true));
    });

    it("keeps negative log-axis ticks visually separated", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: -52.7,
          range_max: -1,
          zero_point: 0,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });
      const labels = scale.ticks.map((tick) => scale.tickFormat(tick));
      const visualGaps = scale.ticks
        .slice(1)
        .map((tick, index) => tick - (scale.ticks[index] as number));

      expect(scale.ticks).toHaveLength(5);
      expect(labels).toEqual(["-52.7", "-20", "-8", "-2.5", "-1"]);
      expect(scale.ticks[0]).toBeLessThanOrEqual(0);
      expect(scale.ticks.at(-1)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...visualGaps) / Math.min(...visualGaps)).toBeLessThan(
        1.45
      );
    });

    it("uses nice guards around an interior logarithmic coverage window", () => {
      const scaling = {
        range_min: 1,
        range_max: 52.7,
        zero_point: 0,
      };
      const coverageDomain = [
        unscaleNominalLocation(3.2, scaling),
        unscaleNominalLocation(41, scaling),
      ] as [number, number];
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: coverageDomain,
        scaling,
        tickCoverageDomain: coverageDomain,
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks).toHaveLength(5);
      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "3",
        "6",
        "12.5",
        "25",
        "50",
      ]);
      expect(scale.ticks[0]).toBeLessThanOrEqual(coverageDomain[0]);
      expect(scale.ticks.at(-1)).toBeGreaterThanOrEqual(coverageDomain[1]);
    });

    it("prefers nice outward log guards over exact visible extrema", () => {
      const scaling = {
        range_min: 1_000_000_000,
        range_max: 100_000_000_000,
        zero_point: 0,
      };
      const coverageDomain = [
        unscaleNominalLocation(18_900_000_000, scaling),
        unscaleNominalLocation(42_900_000_000, scaling),
      ] as [number, number];
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 216,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: coverageDomain,
        scaling,
        tickCoverageDomain: coverageDomain,
        forceTickCount: 6,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "15B",
        "20B",
        "25B",
        "30B",
        "40B",
        "50B",
      ]);
    });

    it("snaps a sub-pixel coverage excess to a canonical log tick", () => {
      const scaling = {
        range_min: 1,
        range_max: 52.7,
        zero_point: 0,
      };
      const coverageDomain = [
        unscaleNominalLocation(1, scaling),
        unscaleNominalLocation(50.0001, scaling),
      ] as [number, number];
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: coverageDomain,
        scaling,
        tickCoverageDomain: coverageDomain,
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks).toHaveLength(5);
      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "1",
        "2.5",
        "8",
        "20",
        "50",
      ]);
      expect(
        Math.abs((scale.ticks.at(-1) as number) - (coverageDomain[1] as number))
      ).toBeLessThan(1 / 200);
    });
  });

  describe("nice numeric ticks", () => {
    it("uses one covering nice lattice instead of labeling visible extrema", () => {
      const scaling = {
        range_min: 0,
        range_max: 3_000_000,
        zero_point: null,
      };
      const visibleDomain = [
        unscaleNominalLocation(1_050_000, scaling),
        unscaleNominalLocation(2_450_000, scaling),
      ] as [number, number];
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 216,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: visibleDomain,
        scaling,
        tickCoverageDomain: visibleDomain,
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "1M",
        "1.5M",
        "2M",
        "2.5M",
      ]);
    });

    it("keeps a nice lattice near a lower hard boundary", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 216,
        direction: ScaleDirection.Vertical,
        domain: [1899, 120000],
        zoomedDomain: [1899, 23157],
        scaling: {
          range_min: 1899,
          range_max: 120000,
          zero_point: null,
        },
        tickCoverageDomain: [2398, 12500],
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.length).toBeLessThanOrEqual(5);
      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "2500",
        "5000",
        "7500",
        "10k",
        "12.5k",
      ]);
    });

    it("keeps a nice lattice near an upper coverage value", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 216,
        direction: ScaleDirection.Vertical,
        domain: [1899, 120000],
        zoomedDomain: [1899, 23157],
        scaling: {
          range_min: 1899,
          range_max: 120000,
          zero_point: null,
        },
        tickCoverageDomain: [6000, 26200],
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.length).toBeLessThanOrEqual(5);
      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "5000",
        "10k",
        "15k",
        "20k",
        "25k",
      ]);
    });

    it("uses one nice lattice when both sides need coverage", () => {
      const scaling = {
        range_min: 0,
        range_max: 5_000_000,
        zero_point: null,
      };
      const visibleDomain = [
        unscaleNominalLocation(1_850_000, scaling),
        unscaleNominalLocation(2_350_000, scaling),
      ] as [number, number];
      const coverageDomain = [
        unscaleNominalLocation(1_860_000, scaling),
        unscaleNominalLocation(2_340_000, scaling),
      ] as [number, number];
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 216,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: visibleDomain,
        scaling,
        tickCoverageDomain: coverageDomain,
        forceTickCount: 5,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.length).toBeLessThanOrEqual(5);
      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "1.8M",
        "2M",
        "2.2M",
        "2.4M",
      ]);
    });

    it("uses round display values for normalized numeric domains", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 250,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: -28.3,
          range_max: 25.2,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });
      const labels = scale.ticks.map((tick) => scale.tickFormat(tick));

      expect(labels).toEqual(["-20", "-10", "0", "10", "20"]);
    });

    it("uses a covering nice lattice without exceeding five ticks", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 150,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: 0,
          range_max: 5,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });
      const labels = scale.ticks.map((tick) => scale.tickFormat(tick));

      expect(labels).toEqual(["0", "2.5", "5"]);
    });

    it("allows six ticks when six are requested", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 150,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: 0,
          range_max: 5,
          zero_point: null,
        },
        forceTickCount: 6,
        alwaysShowTicks: true,
      });

      expect(scale.ticks.map((tick) => scale.tickFormat(tick))).toEqual([
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
    });

    it("uses meaningful half-step ticks when they fit the domain", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 150,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: -2.5,
          range_max: 7.5,
          zero_point: null,
        },
        forceTickCount: 5,
        alwaysShowTicks: true,
      });
      const labels = scale.ticks.map((tick) => scale.tickFormat(tick));

      expect(labels).toEqual(["-2.5", "0", "2.5", "5", "7.5"]);
    });
  });

  describe("graph ticks formatting", () => {
    it("tick format should return a valid string for at least 3 ticks", () => {
      // Given
      const params = {
        displayType: QuestionType.Date,
        axisLength: 200,
        scaling: {
          range_max: 1778803200,
          range_min: 1678838400,
          zero_point: null,
        },
        domain: [0, 1] as [number, number],
        zoomedDomain: [0, 1] as [number, number],
        direction: ScaleDirection.Vertical,
      };

      // When
      const scale = generateScale(params);

      // Then
      const formattedLabels = scale.ticks
        .map((tick) => scale.tickFormat(tick))
        .filter((label) => label !== "");
      expect(formattedLabels.length).toBeGreaterThan(2);
    });
  });

  describe("graph force ticks count", () => {
    it("helper should return specified number of ticks", () => {
      // Given
      const FORCE_TICK_COUNT = 5;
      const params = {
        displayType: QuestionType.Date,
        axisLength: 200,
        scaling: {
          range_max: 1778803200,
          range_min: 1678838400,
          zero_point: null,
        },
        domain: [0, 1] as [number, number],
        zoomedDomain: [0, 1] as [number, number],
        direction: ScaleDirection.Vertical,
        forceTickCount: FORCE_TICK_COUNT,
      };

      // When
      const scale = generateScale(params);

      // Then
      expect(scale.ticks.length).toBe(FORCE_TICK_COUNT);
    });

    it("does not produce NaN when a date axis requests one tick", () => {
      const scale = generateScale({
        displayType: QuestionType.Date,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1],
        zoomedDomain: [0, 1],
        scaling: {
          range_min: 1678838400,
          range_max: 1778803200,
          zero_point: null,
        },
        forceTickCount: 1,
      });

      expect(scale.ticks).toHaveLength(2);
      scale.ticks.forEach((tick) => expect(Number.isNaN(tick)).toBe(false));
    });
  });
});

describe("widenDomainToTicks", () => {
  it("widens both bounds to contain generated ticks", () => {
    expect(widenDomainToTicks([0.2, 0.8], [0.1, 0.5, 0.9])).toEqual([0.1, 0.9]);
  });

  it("preserves a domain that already contains its ticks", () => {
    expect(widenDomainToTicks([0.2, 0.8], [0.3, 0.5, 0.7])).toEqual([0.2, 0.8]);
  });

  it("uses only the nearest tick beyond each boundary", () => {
    expect(widenDomainToTicks([0.2, 0.8], [0, 0.1, 0.9, 1])).toEqual([
      0.1, 0.9,
    ]);
  });
});

describe("restrictScaleTicksToDomain", () => {
  it("removes ticks outside the finalized domain", () => {
    const scale = generateScale({
      displayType: QuestionType.Numeric,
      axisLength: 200,
    });

    expect(restrictScaleTicksToDomain(scale, [0.2, 0.8]).ticks).toEqual(
      scale.ticks.filter((tick) => tick >= 0.2 && tick <= 0.8)
    );
  });
});

describe("generateTimeSeriesYDomain", () => {
  it("calculates a combined domain from step values active in the visible time range", () => {
    const domain = generateTimeSeriesYDomain({
      isChartEmpty: false,
      timeRange: [300, 400],
      sources: [
        {
          minValues: [{ timestamp: 100, y: 0.2 }],
          maxValues: [{ timestamp: 100, y: 0.4 }],
          carryForward: true,
        },
        {
          minValues: [{ timestamp: 200, y: 0.6 }],
          maxValues: [{ timestamp: 200, y: 0.8 }],
          carryForward: true,
        },
      ],
      paddingRatio: 0,
    });

    expect(domain.zoomedYDomain).toEqual([0.2, 0.8]);
    expect(domain.tickCoverageDomain).toEqual([0.2, 0.8]);
  });

  it("should return original domain if chart is empty", () => {
    // Given
    const params = {
      isChartEmpty: true,
      sources: [],
      timeRange: [0, 0] as [number, number],
    };

    // When
    const scale = generateTimeSeriesYDomain(params);

    // Then
    expect(scale.originalYDomain).toEqual([0, 1]);
    expect(scale.zoomedYDomain).toEqual([0, 1]);
  });

  it("should always return either 0 or 1 for binary question", () => {
    // Given
    const params = {
      isChartEmpty: false,
      sources: [
        {
          minValues: [
            { timestamp: 1751271599.875, y: 0.3 },
            { timestamp: 1751537899.677, y: 0.33 },
            { timestamp: 1751285580, y: 0.33 },
          ],
          maxValues: [
            { timestamp: 1751271599.875, y: 0.3 },
            { timestamp: 1751537899.677, y: 0.33 },
            { timestamp: 1751285580, y: 0.33 },
          ],
        },
      ],
      timeRange: [1751271599.875, 1751537899.677] as [number, number],
      includeClosestBoundOnZoom: true,
    };

    // When
    const scale = generateTimeSeriesYDomain(params);

    // Then
    expect(scale.originalYDomain).toEqual([0, 1]);
    expect(scale.zoomedYDomain[0] === 0 || scale.zoomedYDomain[1] === 1).toBe(
      true
    );
  });

  it("should ignore zoom window when useFullYDomain is enabled", () => {
    const params = {
      isChartEmpty: false,
      sources: [
        {
          minValues: [
            { timestamp: 100, y: 0.2 },
            { timestamp: 200, y: 0.45 },
          ],
          maxValues: [
            { timestamp: 100, y: 0.75 },
            { timestamp: 200, y: 0.55 },
          ],
        },
      ],
      timeRange: [150, 200] as [number, number],
      useFullYDomain: true,
    };

    const scale = generateTimeSeriesYDomain(params);

    expect(scale.zoomedYDomain).toEqual([0.15, 0.8]);
  });

  it("should auto zoom for all when useFullYDomain is enabled", () => {
    const params = {
      isChartEmpty: false,
      sources: [
        {
          minValues: [{ timestamp: 100, y: 0.3 }],
          maxValues: [{ timestamp: 100, y: 0.6 }],
        },
      ],
      timeRange: [100, 100] as [number, number],
      useFullYDomain: true,
    };

    const scale = generateTimeSeriesYDomain(params);

    expect(scale.zoomedYDomain).toEqual([0.25, 0.65]);
  });

  it("should auto zoom to the visible window by default for all history", () => {
    const scale = generateTimeSeriesYDomain({
      isChartEmpty: false,
      sources: [
        {
          minValues: [
            { timestamp: 100, y: 0.1 },
            { timestamp: 200, y: 0.4 },
          ],
          maxValues: [
            { timestamp: 100, y: 0.9 },
            { timestamp: 200, y: 0.6 },
          ],
        },
      ],
      timeRange: [150, 200],
    });

    expect(scale.zoomedYDomain).toEqual([0.35, 0.65]);
  });

  it("should pad relative to the visible value span", () => {
    const scale = generateTimeSeriesYDomain({
      isChartEmpty: false,
      sources: [
        {
          minValues: [
            { timestamp: 100, y: 0.2 },
            { timestamp: 200, y: 0.4 },
            { timestamp: 300, y: 0 },
          ],
          maxValues: [
            { timestamp: 100, y: 0.6 },
            { timestamp: 200, y: 0.8 },
            { timestamp: 300, y: 1 },
          ],
        },
      ],
      timeRange: [150, 250],
      paddingRatio: 0.25,
    });

    expect(scale.zoomedYDomain).toEqual([0.3, 0.9]);
  });

  it("should not add explicit padding when the padding ratio is zero", () => {
    const scale = generateTimeSeriesYDomain({
      isChartEmpty: false,
      sources: [
        {
          minValues: [{ timestamp: 100, y: 0.2 }],
          maxValues: [{ timestamp: 100, y: 0.8 }],
        },
      ],
      timeRange: [100, 100],
      paddingRatio: 0,
    });

    expect(scale.zoomedYDomain).toEqual([0.2, 0.8]);
  });

  it("should use minimal safety padding for a flat relative domain", () => {
    const scale = generateTimeSeriesYDomain({
      isChartEmpty: false,
      sources: [
        {
          minValues: [{ timestamp: 100, y: 0.5 }],
          maxValues: [{ timestamp: 100, y: 0.5 }],
        },
      ],
      timeRange: [100, 100],
      paddingRatio: 0.15,
    });

    expect(scale.zoomedYDomain).toEqual([0.49, 0.51]);
  });
});

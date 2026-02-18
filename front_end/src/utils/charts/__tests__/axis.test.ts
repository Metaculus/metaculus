import { ScaleDirection, TimelineChartZoomOption } from "@/types/charts";
import { QuestionType } from "@/types/question";

import { generateScale, generateTimeSeriesYDomain } from "../axis";

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
  });
});

describe("generateTimeSeriesYDomain", () => {
  it("should return original domain if chart is empty", () => {
    // Given
    const params = {
      zoom: TimelineChartZoomOption.All,
      isChartEmpty: true,
      minValues: [] as Array<{
        timestamp: number;
        y: number | null | undefined;
      }>,
      maxValues: [] as Array<{
        timestamp: number;
        y: number | null | undefined;
      }>,
      minTimestamp: 0,
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
      zoom: TimelineChartZoomOption.All,
      isChartEmpty: false,
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
      minTimestamp: 1751271599.875,
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
});

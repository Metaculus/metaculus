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

  describe("d3.ticks linear scaling", () => {
    it("produces nice ticks for an awkward range like [-27.7, 20]", () => {
      // Given: a question with an ugly range_min that previously yielded
      // endpoints like -27.7 and 52.7 with the evenly-spaced algorithm.
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [-27.7, 20] as [number, number],
        zoomedDomain: [-27.7, 20] as [number, number],
        scaling: {
          range_min: -27.7,
          range_max: 20,
          zero_point: null,
        },
      };

      // When
      const scale = generateScale(params);

      // Then: labeled (major) ticks should be nice — multiples of a step
      // that itself is a member of {1,2,5} * 10^k.
      const labeledTicks = scale.ticks.filter(
        (t) => scale.tickFormat(t) !== ""
      );
      expect(labeledTicks.length).toBeGreaterThan(1);

      const first = labeledTicks[0] as number;
      const second = labeledTicks[1] as number;
      const last = labeledTicks[labeledTicks.length - 1] as number;
      const step = second - first;

      const exponent = Math.floor(Math.log10(Math.abs(step)));
      const mantissa = step / Math.pow(10, exponent);
      expect([1, 2, 5]).toContain(Math.round(mantissa));

      const eps = Math.abs(step) * 1e-9;
      expect(Math.abs(first - Math.round(first / step) * step)).toBeLessThan(
        eps
      );
      expect(Math.abs(last - Math.round(last / step) * step)).toBeLessThan(eps);
    });

    it("produces nice ticks for [0, 100]", () => {
      // Given
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 100] as [number, number],
        zoomedDomain: [0, 100] as [number, number],
        scaling: {
          range_min: 0,
          range_max: 100,
          zero_point: null,
        },
      };

      // When
      const scale = generateScale(params);

      // Then: labeled (major) ticks should match one of d3's expected outputs.
      const labeledTicks = scale.ticks.filter(
        (t) => scale.tickFormat(t) !== ""
      );
      const valid1 = [0, 25, 50, 75, 100];
      const valid2 = [0, 20, 40, 60, 80, 100];
      const arraysEqual = (a: number[], b: number[]) =>
        a.length === b.length && a.every((v, i) => v === b[i]);

      expect(
        arraysEqual(labeledTicks, valid1) || arraysEqual(labeledTicks, valid2)
      ).toBe(true);
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

    it("treats forceTickCount as a hint for numeric linear scales so labels stay nice", () => {
      // Regression: previously forceTickCount on a numeric axis bypassed
      // d3.ticks and produced evenly-spaced labels like
      // [-27.7, -15.78, -3.85, 8.08, 20]. We now expect d3-nice values.
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 400,
        direction: ScaleDirection.Vertical,
        domain: [0, 1] as [number, number],
        zoomedDomain: [0, 1] as [number, number],
        scaling: {
          range_min: -27.7,
          range_max: 20,
          zero_point: null,
        },
        forceTickCount: 5,
      };

      const scale = generateScale(params);

      const labeledRangeValues = scale.ticks
        .filter((t) => scale.tickFormat(t) !== "")
        .map((t) => -27.7 + t * (20 - -27.7));

      expect(labeledRangeValues.length).toBeGreaterThan(1);
      const step =
        (labeledRangeValues[1] as number) - (labeledRangeValues[0] as number);
      const exponent = Math.floor(Math.log10(Math.abs(step)));
      const mantissa = Math.abs(step) / Math.pow(10, exponent);
      expect([1, 2, 5]).toContain(Math.round(mantissa));

      const eps = Math.abs(step) * 1e-6;
      labeledRangeValues.forEach((v) => {
        expect(Math.abs(v - Math.round(v / step) * step)).toBeLessThan(eps);
      });
    });

    it("treats forceTickCount as a hint when domain is normalized to [0, 1]", () => {
      // Production-like: domain is [0, 1], range is the actual data range.
      // The labeled display values must be d3-nice in range space.
      const params = {
        displayType: QuestionType.Numeric,
        axisLength: 400,
        direction: ScaleDirection.Vertical,
        domain: [0, 1] as [number, number],
        zoomedDomain: [0, 1] as [number, number],
        scaling: {
          range_min: 0,
          range_max: 100,
          zero_point: null,
        },
        forceTickCount: 5,
      };

      const scale = generateScale(params);

      const labeledDomainTicks = scale.ticks.filter(
        (t) => scale.tickFormat(t) !== ""
      );
      const labeledRangeValues = labeledDomainTicks.map((t) => 0 + t * 100);

      // d3.ticks(0, 100, 5) returns [0, 20, 40, 60, 80, 100] or
      // [0, 25, 50, 75, 100] — both are acceptable nice outputs.
      const valid1 = [0, 25, 50, 75, 100];
      const valid2 = [0, 20, 40, 60, 80, 100];
      const arraysEqual = (a: number[], b: number[]) =>
        a.length === b.length &&
        a.every((v, i) => Math.abs(v - (b[i] as number)) < 1e-6);
      expect(
        arraysEqual(labeledRangeValues, valid1) ||
          arraysEqual(labeledRangeValues, valid2)
      ).toBe(true);
    });

    it("does not throw when forceTickCount is 1 on a date axis", () => {
      // Edge case: forceTickCount === 1 used to produce NaN ticks via i/0.
      const params = {
        displayType: QuestionType.Date,
        axisLength: 200,
        direction: ScaleDirection.Vertical,
        domain: [0, 1] as [number, number],
        zoomedDomain: [0, 1] as [number, number],
        scaling: {
          range_min: 1678838400,
          range_max: 1778803200,
          zero_point: null,
        },
        forceTickCount: 1,
      };

      const scale = generateScale(params);
      scale.ticks.forEach((t) => expect(Number.isNaN(t)).toBe(false));
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

  it("should ignore zoom window when useFullYDomain is enabled", () => {
    const params = {
      zoom: TimelineChartZoomOption.OneDay,
      isChartEmpty: false,
      minValues: [
        { timestamp: 100, y: 0.2 },
        { timestamp: 200, y: 0.45 },
      ],
      maxValues: [
        { timestamp: 100, y: 0.75 },
        { timestamp: 200, y: 0.55 },
      ],
      minTimestamp: 150,
      useFullYDomain: true,
    };

    const scale = generateTimeSeriesYDomain(params);

    expect(scale.zoomedYDomain).toEqual([0.15, 0.8]);
  });

  it("should auto zoom for all when useFullYDomain is enabled", () => {
    const params = {
      zoom: TimelineChartZoomOption.All,
      isChartEmpty: false,
      minValues: [{ timestamp: 100, y: 0.3 }],
      maxValues: [{ timestamp: 100, y: 0.6 }],
      minTimestamp: 100,
      useFullYDomain: true,
    };

    const scale = generateTimeSeriesYDomain(params);

    expect(scale.zoomedYDomain).toEqual([0.25, 0.65]);
  });
});

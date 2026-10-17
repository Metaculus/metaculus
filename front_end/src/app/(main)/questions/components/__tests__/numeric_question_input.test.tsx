import { isApproximatelyEqualScaling } from "../numeric_question_input";

describe("isApproximatelyEqualScaling", () => {
  it("treats exactly equal numbers as equal", () => {
    expect(isApproximatelyEqualScaling(42, 42)).toBe(true);
    expect(isApproximatelyEqualScaling(0, 0)).toBe(true);
    expect(isApproximatelyEqualScaling(-1.5, -1.5)).toBe(true);
  });

  it("absorbs tiny float drift around small numeric/discrete bounds", () => {
    expect(isApproximatelyEqualScaling(1.2, 1.2 + 1e-10)).toBe(true);
    expect(isApproximatelyEqualScaling(0.1 + 0.2, 0.3)).toBe(true);
    const derived = 5 - 0.5 * 0.3333333333 + 0.5 * 0.3333333333;
    expect(isApproximatelyEqualScaling(derived, 5)).toBe(true);
  });

  it("absorbs harmless precision drift on large Date-like timestamps", () => {
    const ts = 1_700_000_000;
    const noisy = (1e10 * ts) / 1e10;
    expect(isApproximatelyEqualScaling(noisy, ts)).toBe(true);
    expect(isApproximatelyEqualScaling(ts + ts * 4 * Number.EPSILON, ts)).toBe(
      true
    );
  });

  it("detects meaningful differences, including sub-second date edits", () => {
    expect(isApproximatelyEqualScaling(1_700_000_001, 1_700_000_000)).toBe(
      false
    );
    expect(isApproximatelyEqualScaling(4.75, 5)).toBe(false);
    expect(isApproximatelyEqualScaling(1.2, 1.2 + 1e-6)).toBe(false);
  });

  it("preserves null / undefined semantics", () => {
    expect(isApproximatelyEqualScaling(null, null)).toBe(true);
    expect(isApproximatelyEqualScaling(undefined, undefined)).toBe(true);
    expect(isApproximatelyEqualScaling(null, undefined)).toBe(false);
    expect(isApproximatelyEqualScaling(null, 0)).toBe(false);
    expect(isApproximatelyEqualScaling(5, undefined)).toBe(false);
    expect(isApproximatelyEqualScaling(NaN, undefined)).toBe(false);
    expect(isApproximatelyEqualScaling(NaN, NaN)).toBe(true);
  });
});

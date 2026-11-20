import { round } from "lodash";

import {
  DamperSliderComponent,
  DistributionSliderComponent,
  LogisticSliderComponent,
  PinnedOutOfBounds,
  SliderComponentType,
  UniformSliderComponent,
} from "@/types/question";

// Limits on pinned out-of-bounds mass for an open bound. These match what
// the backend accepts (cdf[0] >= 0.001, cdf[-1] <= 0.999) and leave at
// least 1% of the mass inbound, which standardization requires.
const PINNED_OUT_OF_BOUNDS_MIN = 0.001;
const PINNED_OUT_OF_BOUNDS_MAX = 0.989;
const PINNED_OUT_OF_BOUNDS_MAX_TOTAL = 0.99;
// Pinned values are kept to 0.1% (as 0-1 probabilities)
const PINNED_OUT_OF_BOUNDS_DECIMALS = 3;
// Minimum width of a uniform/damper segment (as a 0-1 location)
export const MIN_SEGMENT_WIDTH = 0.01;

type Bounds = {
  open_lower_bound?: boolean | null;
  open_upper_bound?: boolean | null;
};

export function getSliderComponentType(
  component: DistributionSliderComponent
): SliderComponentType {
  return component.type ?? SliderComponentType.Logistic;
}

export function isDamperComponent(
  component: DistributionSliderComponent
): component is DamperSliderComponent {
  return component.type === SliderComponentType.Damper;
}

export function isUniformComponent(
  component: DistributionSliderComponent
): component is UniformSliderComponent {
  return component.type === SliderComponentType.Uniform;
}

/** Components defined by a [left, right] segment (edited with a range slider) */
export function isSegmentComponent(
  component: DistributionSliderComponent
): component is UniformSliderComponent | DamperSliderComponent {
  return isUniformComponent(component) || isDamperComponent(component);
}

/** A component's weight in the mixture, or a damper's strength */
export function getComponentMagnitude(
  component: DistributionSliderComponent
): number {
  return isDamperComponent(component) ? component.strength : component.weight;
}

/** Whether components can only be represented in advanced mode */
export function hasAdvancedSliderComponents(
  components: DistributionSliderComponent[]
): boolean {
  return components.some(
    (c) => getSliderComponentType(c) !== SliderComponentType.Logistic
  );
}

/** The component a new slider forecast, or an added component, starts with */
export function makeDefaultSliderComponent(): LogisticSliderComponent {
  return {
    type: SliderComponentType.Logistic,
    left: 0.4,
    center: 0.5,
    right: 0.6,
    weight: 1,
  };
}

/**
 * A new component of the given type. `magnitude` is its weight, or a
 * damper's strength, so it carries over when switching types.
 */
export function makeSliderComponent(
  type: SliderComponentType,
  magnitude: number
): DistributionSliderComponent {
  switch (type) {
    case SliderComponentType.Uniform:
      return { type, left: 0, right: 1, weight: magnitude };
    case SliderComponentType.Damper:
      return { type, left: 0.4, right: 0.6, strength: magnitude };
    case SliderComponentType.Logistic:
      return { ...makeDefaultSliderComponent(), weight: magnitude };
  }
}

export function hasOpenBound(bounds: Bounds): boolean {
  return !!bounds.open_lower_bound || !!bounds.open_upper_bound;
}

/**
 * Forces pinned out-of-bounds values into the allowed limits, rounded to
 * 0.1%: exactly 0 on
 * a closed bound; within [PINNED_OUT_OF_BOUNDS_MIN, PINNED_OUT_OF_BOUNDS_MAX]
 * on an open bound; and at most PINNED_OUT_OF_BOUNDS_MAX_TOTAL combined.
 *
 * If the total is too large, `yieldingSide` is reduced to fit (pass the side
 * being edited, so editing one value never changes the other). Defaults to
 * the larger side.
 */
export function reconcilePinnedOutOfBounds(
  pinned: PinnedOutOfBounds,
  bounds: Bounds,
  yieldingSide?: keyof PinnedOutOfBounds
): PinnedOutOfBounds {
  const clampOpen = (x: number) =>
    Number.isFinite(x)
      ? Math.min(
          Math.max(
            round(x, PINNED_OUT_OF_BOUNDS_DECIMALS),
            PINNED_OUT_OF_BOUNDS_MIN
          ),
          PINNED_OUT_OF_BOUNDS_MAX
        )
      : PINNED_OUT_OF_BOUNDS_MIN;
  const result: PinnedOutOfBounds = {
    below_lower_bound: bounds.open_lower_bound
      ? clampOpen(pinned.below_lower_bound)
      : 0,
    above_upper_bound: bounds.open_upper_bound
      ? clampOpen(pinned.above_upper_bound)
      : 0,
  };
  if (
    result.below_lower_bound + result.above_upper_bound >
    PINNED_OUT_OF_BOUNDS_MAX_TOTAL
  ) {
    // Both sides are open here (a closed side is 0, so the total couldn't
    // exceed the limit), and the other side is <= MAX, so this stays >= MIN
    const side =
      yieldingSide ??
      (result.below_lower_bound >= result.above_upper_bound
        ? "below_lower_bound"
        : "above_upper_bound");
    const other =
      side === "below_lower_bound" ? "above_upper_bound" : "below_lower_bound";
    result[side] = round(
      PINNED_OUT_OF_BOUNDS_MAX_TOTAL - result[other],
      PINNED_OUT_OF_BOUNDS_DECIMALS
    );
  }
  return result;
}

/**
 * Pinned values carried over to a question (e.g. copied or pasted from
 * another one) that may have different bounds: reconciled with its bounds,
 * or dropped if it has no open bound.
 */
export function fitPinnedOutOfBounds(
  pinned: PinnedOutOfBounds | null | undefined,
  bounds: Bounds
): PinnedOutOfBounds | null {
  return pinned && hasOpenBound(bounds)
    ? reconcilePinnedOutOfBounds(pinned, bounds)
    : null;
}

/**
 * Pinned values matching the out-of-bounds mass of an existing CDF, so that
 * turning pinning on doesn't move the distribution.
 */
export function pinnedOutOfBoundsFromCdf(
  cdf: number[],
  bounds: Bounds
): PinnedOutOfBounds {
  return reconcilePinnedOutOfBounds(
    {
      below_lower_bound: cdf[0] ?? 0,
      above_upper_bound: 1 - (cdf[cdf.length - 1] ?? 1),
    },
    bounds
  );
}

import { useTranslations } from "next-intl";
import { KeyboardEvent, useCallback } from "react";
import toast from "react-hot-toast";

import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  PinnedOutOfBounds,
  Quantile,
  Scaling,
} from "@/types/question";
import { isPercentileRow } from "@/utils/forecasts/quantile_components";
import { fitPinnedOutOfBounds } from "@/utils/forecasts/slider_components";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

// Matches the tolerance validateQuantileInput (forecast_maker/helpers.ts)
// enforces for open-bound probabilities: [0.1, 99.9].
const OPEN_BOUND_PROBABILITY_MIN = 0.1;
const OPEN_BOUND_PROBABILITY_MAX = 99.9;
// Small nudge off 0/1 so a rescaled quantile lands strictly inside a closed
// bound, matching validateQuantileInput's strict `<=`/`>=` range checks.
const CLOSED_BOUND_LOCATION_EPSILON = 0.001;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const CLIPBOARD_MARKER = "_metaculus_distribution";

type ClipboardDistribution = {
  [CLIPBOARD_MARKER]: true;
  type: ContinuousForecastInputType;
  components: DistributionSliderComponent[] | DistributionQuantileComponent;
  // Slider distributions only
  pinned_out_of_bounds?: PinnedOutOfBounds | null;
};

const VALID_INPUT_TYPES: string[] = Object.values(ContinuousForecastInputType);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// Quantile values are in the question's real-world units, which aren't
// meaningful on a different question. Percentile rows hold actual values;
// `below_lower_bound`/`above_upper_bound` are already scale-independent
// percentages, so they're left as-is.
function toPortableQuantileComponents(
  components: DistributionQuantileComponent,
  scaling: Scaling
): DistributionQuantileComponent {
  return components.map((c) =>
    isPercentileRow(c) && c.value !== undefined
      ? { ...c, value: unscaleNominalLocation(c.value, scaling) }
      : c
  );
}

// Rescales a pasted (portable) quantile distribution into the target
// question's units, and reconciles it with the target's own open/closed
// bounds — which may differ from the question it was copied from:
// - below_lower_bound/above_upper_bound (probability mass outside the
//   range) must be exactly 0 on a closed bound (there's no UI to edit that
//   cell once it's not 0 — see continuous_table/index.tsx) and within
//   [0.1, 99.9] on an open bound.
// - q1/q2/q3 must land strictly inside a closed bound; an open bound has no
//   such constraint.
function fromPortableQuantileComponents(
  components: DistributionQuantileComponent,
  scaling: Scaling,
  openLowerBound: boolean,
  openUpperBound: boolean
): DistributionQuantileComponent {
  return components.map((c) => {
    if (c.value === undefined) return c;
    if (c.quantile === Quantile.lower) {
      return {
        ...c,
        value: openLowerBound
          ? clamp(
              c.value,
              OPEN_BOUND_PROBABILITY_MIN,
              OPEN_BOUND_PROBABILITY_MAX
            )
          : 0,
      };
    }
    if (c.quantile === Quantile.upper) {
      return {
        ...c,
        value: openUpperBound
          ? clamp(
              c.value,
              OPEN_BOUND_PROBABILITY_MIN,
              OPEN_BOUND_PROBABILITY_MAX
            )
          : 0,
      };
    }
    // c.value is still the portable internal [0, 1] location at this point
    let location = c.value;
    if (!openLowerBound && location <= 0) {
      location = CLOSED_BOUND_LOCATION_EPSILON;
    }
    if (!openUpperBound && location >= 1) {
      location = 1 - CLOSED_BOUND_LOCATION_EPSILON;
    }
    return { ...c, value: scaleInternalLocation(location, scaling) };
  });
}

function isClipboardDistribution(data: unknown): data is ClipboardDistribution {
  return (
    typeof data === "object" &&
    data !== null &&
    CLIPBOARD_MARKER in data &&
    (data as ClipboardDistribution)[CLIPBOARD_MARKER] === true &&
    "type" in data &&
    "components" in data &&
    VALID_INPUT_TYPES.includes((data as ClipboardDistribution).type)
  );
}

export type DistributionClipboardData = {
  sliderComponents: DistributionSliderComponent[];
  pinnedOutOfBounds?: PinnedOutOfBounds | null;
  quantileComponents: DistributionQuantileComponent;
  scaling: Scaling;
  openLowerBound: boolean;
  openUpperBound: boolean;
  onPaste: (
    type: ContinuousForecastInputType,
    components: DistributionSliderComponent[] | DistributionQuantileComponent,
    pinnedOutOfBounds: PinnedOutOfBounds | null
  ) => void;
};

/**
 * Copying/pasting distributions via the clipboard, plus the Ctrl+C / Ctrl+V
 * shortcuts (attach `onKeyDown` to the input's container). A hook rather
 * than a component so the shortcuts keep working while the buttons' panel
 * is closed.
 *
 * Returns null without `data`; `paste` is omitted when disabled.
 */
export function useDistributionClipboard({
  data,
  forecastInputMode,
  disabled,
}: {
  data: DistributionClipboardData | undefined;
  forecastInputMode: ContinuousForecastInputType;
  disabled?: boolean;
}): {
  copy: () => void;
  paste?: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
} | null {
  const t = useTranslations();

  const handleCopy = useCallback(async () => {
    if (!data) return;
    const clipboardDistribution: ClipboardDistribution = {
      [CLIPBOARD_MARKER]: true,
      type: forecastInputMode,
      ...(forecastInputMode === ContinuousForecastInputType.Slider
        ? {
            components: data.sliderComponents,
            pinned_out_of_bounds: data.pinnedOutOfBounds ?? null,
          }
        : {
            components: toPortableQuantileComponents(
              data.quantileComponents,
              data.scaling
            ),
          }),
    };
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(clipboardDistribution)
      );
      toast(t("distributionCopied"));
    } catch {
      toast.error(t("distributionCopyFailed"));
    }
  }, [data, forecastInputMode, t]);

  const handlePaste = useCallback(async () => {
    if (!data) return;
    try {
      const text = await navigator.clipboard.readText();
      const parsed: unknown = JSON.parse(text);
      if (!isClipboardDistribution(parsed)) {
        toast.error(t("distributionPasteInvalid"));
        return;
      }
      const components =
        parsed.type === ContinuousForecastInputType.Quantile
          ? fromPortableQuantileComponents(
              parsed.components as DistributionQuantileComponent,
              data.scaling,
              data.openLowerBound,
              data.openUpperBound
            )
          : parsed.components;
      // Pins have to fit the target question's bounds
      const pinned =
        parsed.type === ContinuousForecastInputType.Slider
          ? fitPinnedOutOfBounds(parsed.pinned_out_of_bounds, {
              open_lower_bound: data.openLowerBound,
              open_upper_bound: data.openUpperBound,
            })
          : null;
      data.onPaste(parsed.type, components, pinned);
      toast(t("distributionPasted"));
    } catch {
      toast.error(t("distributionPasteInvalid"));
    }
  }, [data, t]);

  // Ctrl+C / Ctrl+V keyboard shortcuts. A React handler rather than a native
  // listener, so it also covers portaled children like the options panel.
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    // Let native copy/paste happen when the user is focused on a form field
    // (e.g. a percentile input) instead of hijacking the shortcut
    if (isEditableTarget(e.target)) return;

    if (e.key === "c") {
      // Only intercept if no text is selected
      const selection = window.getSelection()?.toString();
      if (selection) return;
      e.preventDefault();
      handleCopy();
    } else if (e.key === "v" && !disabled) {
      e.preventDefault();
      handlePaste();
    }
  };

  if (!data) return null;
  return {
    copy: handleCopy,
    paste: disabled ? undefined : handlePaste,
    onKeyDown: handleKeyDown,
  };
}

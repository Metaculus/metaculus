import { faCopy, faPaste } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import { ContinuousForecastInputType } from "@/types/charts";
import {
  DistributionQuantileComponent,
  DistributionSliderComponent,
  Quantile,
  Scaling,
} from "@/types/question";
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
};

const VALID_INPUT_TYPES: string[] = Object.values(ContinuousForecastInputType);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// Quantile values are in the question's real-world units, which aren't
// meaningful on a different question. `quantile` is a number (25/50/75) for
// the actual value entries; `below_lower_bound`/`above_upper_bound` are
// already scale-independent percentages, so they're left as-is.
function toPortableQuantileComponents(
  components: DistributionQuantileComponent,
  scaling: Scaling
): DistributionQuantileComponent {
  return components.map((c) =>
    typeof c.quantile === "number" && c.value !== undefined
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

type Props = {
  forecastInputMode: ContinuousForecastInputType;
  sliderComponents: DistributionSliderComponent[];
  quantileComponents: DistributionQuantileComponent;
  scaling: Scaling;
  openLowerBound: boolean;
  openUpperBound: boolean;
  onPaste: (
    type: ContinuousForecastInputType,
    components: DistributionSliderComponent[] | DistributionQuantileComponent
  ) => void;
  disabled?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
};

const ContinuousClipboardMenu: FC<Props> = ({
  forecastInputMode,
  sliderComponents,
  quantileComponents,
  scaling,
  openLowerBound,
  openUpperBound,
  onPaste,
  disabled,
  containerRef,
}) => {
  const t = useTranslations();

  const onPasteRef = useRef(onPaste);
  onPasteRef.current = onPaste;

  const handleCopy = useCallback(async () => {
    const data: ClipboardDistribution = {
      [CLIPBOARD_MARKER]: true,
      type: forecastInputMode,
      components:
        forecastInputMode === ContinuousForecastInputType.Slider
          ? sliderComponents
          : toPortableQuantileComponents(quantileComponents, scaling),
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data));
      toast(t("distributionCopied"));
    } catch {
      toast.error(t("distributionCopyFailed"));
    }
  }, [forecastInputMode, sliderComponents, quantileComponents, scaling, t]);

  const handlePaste = useCallback(async () => {
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
              scaling,
              openLowerBound,
              openUpperBound
            )
          : parsed.components;
      onPasteRef.current(parsed.type, components);
      toast(t("distributionPasted"));
    } catch {
      toast.error(t("distributionPasteInvalid"));
    }
  }, [scaling, openLowerBound, openUpperBound, t]);

  // Ctrl+C / Ctrl+V keyboard shortcuts
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      // Let native copy/paste happen when the user is focused on a form
      // field (e.g. a percentile input) instead of hijacking the shortcut
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

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleCopy, handlePaste, disabled]);

  return (
    <div className="flex gap-1">
      <Button
        className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
        variant="link"
        onClick={handleCopy}
        aria-label={t("copyDistribution")}
        title={t("copyDistribution")}
      >
        <FontAwesomeIcon
          className="text-blue-700 dark:text-blue-700-dark"
          icon={faCopy}
        />
      </Button>
      {!disabled && (
        <Button
          className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
          variant="link"
          onClick={handlePaste}
          aria-label={t("pasteDistribution")}
          title={t("pasteDistribution")}
        >
          <FontAwesomeIcon
            className="text-blue-700 dark:text-blue-700-dark"
            icon={faPaste}
          />
        </Button>
      )}
    </div>
  );
};

export default ContinuousClipboardMenu;

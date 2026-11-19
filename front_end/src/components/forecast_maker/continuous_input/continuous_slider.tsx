import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import MultiSlider from "@/components/sliders/multi_slider";
import RangeSlider from "@/components/sliders/range_slider";
import Slider from "@/components/sliders/slider";
import AbreviatedNumericInput from "@/components/ui/abreviated_numeric_input";
import Checkbox from "@/components/ui/checkbox";
import Select from "@/components/ui/select";
import {
  DistributionSliderComponent,
  PinnedOutOfBounds,
  SliderComponentType,
} from "@/types/question";
import { nudgeBoundProbability } from "@/utils/forecasts/nudge";
import {
  getComponentMagnitude,
  getSliderComponentType,
  hasOpenBound,
  isDamperComponent,
  isSegmentComponent,
  makeSliderComponent,
  MIN_SEGMENT_WIDTH,
  pinnedOutOfBoundsFromCdf,
  reconcilePinnedOutOfBounds,
} from "@/utils/forecasts/slider_components";

type Bounds = {
  open_lower_bound: boolean;
  open_upper_bound: boolean;
};

type Props = {
  components: DistributionSliderComponent[];
  onChange: (components: DistributionSliderComponent[]) => void;
  disabled?: boolean;
  // Advanced mode: per-component types, and pinning out-of-bounds values
  advanced?: {
    bounds: Bounds;
    pinnedOutOfBounds: PinnedOutOfBounds | null;
    onPinnedOutOfBoundsChange: (value: PinnedOutOfBounds | null) => void;
    // Current CDF, to start pinned values from when pinning is turned on
    cdf: number[];
  };
};

const ContinuousSlider: FC<Props> = ({
  components,
  onChange,
  disabled = false,
  advanced,
}) => {
  const t = useTranslations();

  if (disabled) {
    return null;
  }

  const replaceAt = (index: number, component: DistributionSliderComponent) =>
    onChange([
      ...components.slice(0, index),
      component,
      ...components.slice(index + 1),
    ]);

  const typeOptions = [
    {
      value: SliderComponentType.Logistic,
      label: t("sliderComponentTypeLogistic"),
    },
    {
      value: SliderComponentType.Uniform,
      label: t("sliderComponentTypeUniform"),
    },
    {
      value: SliderComponentType.Damper,
      label: t("sliderComponentTypeDamper"),
    },
  ];

  return (
    <>
      {advanced && hasOpenBound(advanced.bounds) && (
        <PinnedOutOfBoundsInput
          value={advanced.pinnedOutOfBounds}
          onChange={advanced.onPinnedOutOfBoundsChange}
          bounds={advanced.bounds}
          cdf={advanced.cdf}
        />
      )}
      {components.map((component, index) => {
        const componentType = getSliderComponentType(component);
        // A damper's strength matters even when it's the only component; a
        // weight only matters relative to others
        const showMagnitude =
          components.length > 1 || isDamperComponent(component);
        return (
          <div className="px-2.5" key={index}>
            {advanced && (
              <Select
                className="mt-2 rounded px-1 text-sm"
                options={typeOptions}
                value={componentType}
                aria-label={t("sliderComponentType")}
                onChange={(e) =>
                  replaceAt(
                    index,
                    makeSliderComponent(
                      e.target.value as SliderComponentType,
                      getComponentMagnitude(component)
                    )
                  )
                }
              />
            )}

            {isSegmentComponent(component) ? (
              <RangeSlider
                value={component}
                step={0.00001}
                minGap={MIN_SEGMENT_WIDTH}
                onChange={({ left, right }) =>
                  replaceAt(index, { ...component, left, right })
                }
              />
            ) : (
              <MultiSlider
                disabled={disabled}
                key={`multi-slider-${index}`}
                value={component}
                step={0.00001}
                clampStep={0.035}
                onChange={(value) =>
                  replaceAt(index, {
                    ...component,
                    left: value.left,
                    center: value.center,
                    right: value.right,
                  })
                }
                shouldSyncWithDefault
              />
            )}

            {showMagnitude && (
              <div className="flex flex-row justify-between">
                <span className="inline pr-2 pt-2">
                  {isDamperComponent(component)
                    ? t("damperStrength")
                    : t("weight")}
                  :
                </span>
                <div className="inline w-3/4">
                  <Slider
                    key={`slider-${index}`}
                    inputMin={0}
                    inputMax={1}
                    step={0.00001}
                    defaultValue={getComponentMagnitude(component)}
                    round={true}
                    onChange={(value) =>
                      replaceAt(
                        index,
                        isDamperComponent(component)
                          ? { ...component, strength: value }
                          : { ...component, weight: value }
                      )
                    }
                    disabled={disabled}
                    shouldSyncWithDefault
                  />
                </div>
                {components.length > 1 && (
                  <FontAwesomeIcon
                    className="inline cursor-pointer pl-2 pt-2"
                    icon={faClose}
                    onClick={() =>
                      onChange(components.filter((_, i) => i !== index))
                    }
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

const PinnedOutOfBoundsInput: FC<{
  value: PinnedOutOfBounds | null;
  onChange: (value: PinnedOutOfBounds | null) => void;
  bounds: Bounds;
  cdf: number[];
}> = ({ value, onChange, bounds, cdf }) => {
  const t = useTranslations();

  const sides = [
    bounds.open_lower_bound && {
      side: "below_lower_bound" as const,
      label: t("belowLowerBound"),
    },
    bounds.open_upper_bound && {
      side: "above_upper_bound" as const,
      label: t("aboveUpperBound"),
    },
  ].filter((x) => !!x);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-2.5">
      <Checkbox
        checked={!!value}
        onChange={(checked) =>
          onChange(
            // Start from the current out-of-bounds mass, so the distribution
            // doesn't jump
            checked ? pinnedOutOfBoundsFromCdf(cdf, bounds) : null
          )
        }
        className="flex flex-row gap-2 text-sm"
        label={t("pinOutOfBoundsValues")}
      />
      {value && (
        <div className="flex flex-wrap gap-3">
          {sides.map(({ side, label }) => (
            <label key={side} className="flex items-center gap-2 text-sm">
              {label}
              <div className="w-24">
                <AbreviatedNumericInput
                  value={value[side] * 100}
                  onChange={(percent) => {
                    if (percent === undefined) return;
                    // Editing one side never changes the other
                    onChange(
                      reconcilePinnedOutOfBounds(
                        { ...value, [side]: percent / 100 },
                        bounds,
                        side
                      )
                    );
                  }}
                  showPercentSign
                  nudge={nudgeBoundProbability}
                />
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContinuousSlider;

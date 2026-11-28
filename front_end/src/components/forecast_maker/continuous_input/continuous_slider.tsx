import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { FC } from "react";

import MultiSlider from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import { DistributionSliderComponent } from "@/types/question";

type Props = {
  components: DistributionSliderComponent[];
  onChange: (components: DistributionSliderComponent[]) => void;
  disabled?: boolean;
};

const ContinuousSlider: FC<Props> = ({
  components,
  onChange,
  disabled = false,
}) => {
  if (disabled) {
    return null;
  }

  const replaceAt = (index: number, component: DistributionSliderComponent) =>
    onChange([
      ...components.slice(0, index),
      component,
      ...components.slice(index + 1),
    ]);

  return (
    <>
      {components.map((forecastValue, index) => {
        return (
          <div className="px-2.5" key={index}>
            {!isNil(forecastValue) && (
              <MultiSlider
                disabled={disabled}
                key={`multi-slider-${index}`}
                value={forecastValue}
                step={0.00001}
                clampStep={0.035}
                onChange={(value) =>
                  replaceAt(index, {
                    left: value.left,
                    center: value.center,
                    right: value.right,
                    weight: forecastValue.weight,
                  })
                }
                shouldSyncWithDefault
              />
            )}

            {components.length > 1 && !isNil(forecastValue.weight) && (
              <div className="flex flex-row justify-between">
                <span className="inline pr-2 pt-2">weight:</span>
                <div className="inline w-3/4">
                  <Slider
                    key={`slider-${index}`}
                    inputMin={0}
                    inputMax={1}
                    step={0.00001}
                    defaultValue={forecastValue.weight}
                    round={true}
                    onChange={(value) =>
                      replaceAt(index, { ...forecastValue, weight: value })
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

export default ContinuousSlider;

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
                onChange={(value) => {
                  const newForecast = [
                    ...components.slice(0, index),
                    {
                      left: value.left,
                      center: value.center,
                      right: value.right,
                      weight: forecastValue.weight,
                    },
                    ...components.slice(index + 1, components.length),
                  ];
                  onChange(newForecast);
                }}
                shouldSyncWithDefault
              />
            )}

            {!!components.length && !isNil(forecastValue.weight) && (
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
                    onChange={(value) => {
                      const newForecast = [
                        ...components.slice(0, index),
                        {
                          ...forecastValue,
                          weight: value,
                        },
                        ...components.slice(index + 1, components.length),
                      ];
                      onChange(newForecast);
                    }}
                    disabled={disabled}
                    shouldSyncWithDefault
                  />
                </div>
                {components.length > 1 && (
                  <FontAwesomeIcon
                    className="inline cursor-pointer pl-2 pt-2"
                    icon={faClose}
                    onClick={() => {
                      const newForecast = [
                        ...components.slice(0, index),
                        ...components.slice(index + 1, components.length),
                      ];
                      onChange(newForecast);
                    }}
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

import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import Slider from "@/components/sliders/slider";

import ForecastTextInput from "./forecast_text_input";

const DEFAULT_SLIDER_VALUE = 50;
export const BINARY_FORECAST_PRECISION = 3;
export const BINARY_MIN_VALUE = 10 ** -BINARY_FORECAST_PRECISION * 100;
export const BINARY_MAX_VALUE = 100 - BINARY_MIN_VALUE;
const THRESHOLD = 7; // Add this line to set the threshold value

type Props = {
  forecast: number | null;
  onChange: (forecast: number) => void;
  isDirty: boolean;
  onBecomeDirty?: () => void;
  communityForecast?: number | null;
  disabled?: boolean;
  helperDisplay?: boolean;
};

const BinarySlider: FC<Props> = ({
  onChange,
  forecast,
  isDirty,
  communityForecast,
  onBecomeDirty,
  disabled = false,
  helperDisplay = false,
}) => {
  const inputDisplayValue = forecast ? forecast.toString() + "%" : "—";
  const [inputValue, setInputValue] = useState(inputDisplayValue);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [sliderValue, setSliderValue] = useState(
    forecast ?? DEFAULT_SLIDER_VALUE
  ); // Add this line to track the slider value

  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(inputDisplayValue);
    }
  }, [inputDisplayValue, isInputFocused]);

  const handleSliderForecastChange = useCallback(
    (value: number) => {
      setInputValue(value.toString() + "%");
      setSliderValue(value); // Add this line to update the slider value
      onBecomeDirty?.();
      onChange(value);
    },
    [onBecomeDirty, onChange]
  );
  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      onBecomeDirty?.();
    },
    [onBecomeDirty]
  );
  const handleInputForecastChange = useCallback(
    (value: number) => {
      onBecomeDirty?.();
      onChange(value);
    },
    [onBecomeDirty, onChange]
  );

  const isNearCommunityForecast =
    communityForecast !== null &&
    communityForecast !== undefined &&
    Math.abs(sliderValue - communityForecast * 100) <= THRESHOLD; // Add this line to check if the slider value is near the community forecast

  return (
    <>
      <div className="group relative mx-6 mt-8 h-16">
        <Slider
          inputMin={BINARY_MIN_VALUE}
          inputMax={BINARY_MAX_VALUE}
          defaultValue={forecast ?? DEFAULT_SLIDER_VALUE}
          onChange={handleSliderForecastChange}
          step={1}
          arrowStep={0.1}
          shouldSyncWithDefault
          marks={
            communityForecast
              ? {
                  // Pass the isNear prop
                  [communityForecast * 100]: (
                    <MarkArrow
                      value={communityForecast}
                      isNear={isNearCommunityForecast}
                    />
                  ),
                }
              : undefined
          }
          disabled={disabled}
          styles={disabled ? { handle: { cursor: "default" } } : {}}
          showValue
        />
        {forecast !== null && helperDisplay && (
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: `${((forecast - BINARY_MIN_VALUE) / (BINARY_MAX_VALUE - BINARY_MIN_VALUE)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="w-full self-center text-center text-orange-700/50 dark:text-orange-300/50">
              <FontAwesomeIcon icon={faChevronUp} />
            </div>
            <span className="mt-[-4px] block text-orange-700 dark:text-orange-300">
              Me
            </span>
          </div>
        )}
        {/* {helperDisplay && ( // Conditionally render the "Very Unlikely" and "Very Likely" labels based on helperDisplay prop
          <>
              <div className="absolute left-0 top-4 mt-2 text-xs text-gray-500 z-1">
                Very Unlikely
              </div>
              <div className="absolute right-0 top-4 mt-2 text-xs text-gray-500 z-1">
                Very Likely
              </div>
          </>
        )} */}
      </div>
      {/* <div className="mb-3 block text-center">
        <ForecastTextInput
          value={inputValue}
          minValue={BINARY_MIN_VALUE}
          maxValue={BINARY_MAX_VALUE}
          onChange={handleInputChange}
          onForecastChange={handleInputForecastChange}
          isDirty={isDirty}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          disabled={disabled}
        />
      </div> */}
    </>
  );
};

const MarkArrow: FC<{ value: number; isNear: boolean }> = ({
  value,
  isNear,
}) => {
  // Add isNear prop
  const t = useTranslations();
  return (
    <div
      className={`absolute flex -translate-x-1/2 ${isNear ? "translate-y-[-36px]" : "translate-y-[-24px]"} flex-col items-center gap-0 whitespace-nowrap text-sm font-bold text-gray-700 transition-transform duration-150 dark:text-gray-700-dark`}
    >
      <span>
        {t("community")}: {`${Math.round(1000 * value) / 10}%`}
      </span>
      <FontAwesomeIcon icon={faChevronDown} />
    </div>
  );
};

export default BinarySlider;

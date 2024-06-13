"use client";

import { FC, useCallback, useEffect, useState } from "react";

import ForecastInput from "@/components/forecast_maker/forecast_input";
import Slider from "@/components/sliders/slider";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

type Props = {
  choiceName: string;
  min: number;
  max: number;
  defaultSliderValue: number;
  forecastValue: number | null;
  communityForecast: number | null;
  onChange: (choice: string, forecast: number) => void;
  isDirty: boolean;
};

const ForecastChoiceInput: FC<Props> = ({
  communityForecast,
  min,
  max,
  choiceName,
  onChange,
  defaultSliderValue,
  forecastValue,
  isDirty,
}) => {
  const inputDisplayValue = forecastValue
    ? forecastValue?.toString() + "%"
    : "—";
  const [inputValue, setInputValue] = useState(inputDisplayValue);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(inputDisplayValue);
    }
  }, [inputDisplayValue, isInputFocused]);

  const handleSliderForecastChange = useCallback(
    (value: number) => {
      onChange(choiceName, value);
    },
    [choiceName, onChange]
  );
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);
  const handleInputForecastChange = useCallback(
    (value: number) => {
      onChange(choiceName, value);
    },
    [choiceName, onChange]
  );

  return (
    <>
      <td className="border-t border-gray-300 p-2 text-right text-sm font-medium dark:border-gray-300-dark">
        {communityForecast
          ? getForecastPctDisplayValue(communityForecast)
          : "-"}
      </td>
      <td className="border-t border-gray-300 p-2 text-center dark:border-gray-300-dark">
        <ForecastInput
          onChange={handleInputChange}
          onForecastChange={handleInputForecastChange}
          isDirty={isDirty}
          minValue={min}
          maxValue={max}
          value={inputValue}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </td>
      <td className="hidden w-full border-t border-gray-300 p-2 dark:border-gray-300-dark sm:table-cell">
        <Slider
          min={min}
          max={max}
          defaultValue={forecastValue ?? defaultSliderValue}
          onChange={handleSliderForecastChange}
          step={1}
          arrowStep={0.1}
          shouldSyncWithDefault
        />
      </td>
    </>
  );
};

export default ForecastChoiceInput;

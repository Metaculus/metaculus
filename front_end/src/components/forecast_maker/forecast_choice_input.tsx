"use client";
import { FC } from "react";

import ForecastInput from "@/components/forecast_maker/forecast_input";
import Slider from "@/components/sliders/slider";
import useSliderForecast from "@/hooks/use_slider_forecast";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

type Props = {
  choiceName: string;
  min: number;
  max: number;
  defaultSliderValue: number;
  forecastValue: number | null;
  communityForecast: number | null;
  onChange: (choice: string, forecast: number) => void;
};

const ForecastChoiceInput: FC<Props> = ({
  communityForecast,
  min,
  max,
  choiceName,
  onChange,
  defaultSliderValue,
  forecastValue,
}) => {
  const {
    forecast,
    inputValue,
    isForecastDirty,
    handleInputForecastChange,
    handleSliderForecastChange,
    handleInputChange,
  } = useSliderForecast({ value: forecastValue });

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
          onForecastChange={(value) => {
            onChange(choiceName, value);
            handleInputForecastChange(value);
          }}
          isDirty={isForecastDirty}
          minValue={min}
          maxValue={max}
          value={inputValue}
        />
      </td>
      <td className="hidden w-full border-t border-gray-300 p-2 dark:border-gray-300-dark sm:table-cell">
        <Slider
          min={min}
          max={max}
          defaultValue={forecast ?? defaultSliderValue}
          onChange={(value) => {
            onChange(choiceName, value);
            handleSliderForecastChange(value);
          }}
          step={1}
          arrowStep={0.1}
          shouldSyncWithDefault
        />
      </td>
    </>
  );
};

export default ForecastChoiceInput;

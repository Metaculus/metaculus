"use client";

import classNames from "classnames";
import { FC, useCallback, useEffect, useState } from "react";

import ChoiceIcon from "@/components/choice_icon";
import Slider from "@/components/sliders/slider";
import useAppTheme from "@/hooks/use_app_theme";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

import ForecastTextInput from "./forecast_text_input";

type Props = {
  choiceColor: {
    DEFAULT: string;
    dark: string;
  };
  choiceName: string;
  min: number;
  max: number;
  defaultSliderValue: number;
  forecastValue: number | null;
  communityForecast: number | null;
  onChange: (choice: string, forecast: number) => void;
  isDirty: boolean;
};

const ForecastChoiceOption: FC<Props> = ({
  communityForecast,
  min,
  max,
  choiceName,
  choiceColor,
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

  const SliderElement = (
    <div className="ml-5 mr-7">
      <Slider
        min={min}
        max={max}
        defaultValue={forecastValue ?? defaultSliderValue}
        onChange={handleSliderForecastChange}
        step={1}
        arrowStep={0.1}
        shouldSyncWithDefault
        arrowClassName="bg-gray-0 text-orange-700 hover:text-orange-800 active:text-orange-900 dark:bg-gray-0-dark dark:text-orange-700-dark dark:hover:text-orange-800-dark dark:active:text-orange-900-dark"
        marks={
          communityForecast
            ? {
                [communityForecast * 100]: <MarkArrow color={choiceColor} />,
              }
            : undefined
        }
      />
    </div>
  );

  return (
    <>
      <tr>
        <th className="w-full border-t border-gray-300 p-2 text-left text-sm font-bold leading-6 dark:border-gray-300-dark sm:w-auto sm:min-w-[10rem] sm:text-base">
          <div className="flex gap-2">
            <ChoiceIcon className="mt-1 shrink-0" color={choiceColor} />
            {choiceName}
          </div>
        </th>
        <td className="border-t border-gray-300 p-2 text-right text-sm font-medium dark:border-gray-300-dark">
          {communityForecast
            ? getForecastPctDisplayValue(communityForecast)
            : "-"}
        </td>
        <td className="border-t border-gray-300 p-2 text-center dark:border-gray-300-dark">
          <ForecastTextInput
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
          {SliderElement}
        </td>
      </tr>
      <tr className="sm:hidden">
        <td
          className="w-full border-t border-none border-gray-300 p-2 px-6 pt-0 dark:border-gray-300-dark"
          colSpan={4}
        >
          {SliderElement}
        </td>
      </tr>
    </>
  );
};

const MarkArrow: FC<{
  color: {
    DEFAULT: string;
    dark: string;
  };
}> = ({ color }) => {
  const { theme } = useAppTheme();

  return (
    <svg
      className={classNames("absolute top-0.5 -translate-x-1/2")}
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
    >
      <path
        d="M5.99984 8L11.9998 0H-0.000158574L5.99984 8Z"
        fill={theme === "dark" ? color.dark : color.DEFAULT}
      />
    </svg>
  );
};

export default ForecastChoiceOption;

"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import {
  FC,
  useCallback,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from "react";

import ChoiceIcon from "@/components/choice_icon";
import ResolutionIcon from "@/components/icons/resolution";
import Slider from "@/components/sliders/slider";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";
import { getForecastPctDisplayValue } from "@/utils/formatters/prediction";

import ForecastTextInput from "./forecast_text_input";

type OptionResolution = {
  resolution: Resolution | null;
  type: "question" | "group_question";
};

type Props<T> = {
  choiceColor: ThemeColor;
  id: T;
  choiceName: string;
  inputMin: number;
  inputMax: number;
  defaultSliderValue: number;
  forecastValue: number | null;
  communityForecast?: number | null;
  onChange: (id: T, forecast: number) => void;
  isDirty: boolean;
  isRowDirty?: boolean;
  menu?: ReactNode;
  disabled?: boolean;
  optionResolution?: OptionResolution;
  highlightedOptionId?: T;
  onOptionClick?: (id: T) => void;
};

const ForecastChoiceOption = <T = string,>({
  highlightedOptionId,
  communityForecast,
  inputMin,
  inputMax,
  id,
  choiceName,
  choiceColor,
  onChange,
  defaultSliderValue,
  forecastValue,
  isDirty,
  isRowDirty,
  menu,
  disabled = false,
  optionResolution,
  onOptionClick,
}: Props<T>) => {
  const t = useTranslations();

  const inputDisplayValue = forecastValue
    ? forecastValue?.toString() + "%"
    : "—";
  const [inputValue, setInputValue] = useState(inputDisplayValue);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { getThemeColor } = useAppTheme();

  const { resolution, type: resolutionType } = optionResolution ?? {};
  const isQuestionResolved =
    resolutionType === "question" && resolution === choiceName;
  const isGroupResolutionHighlighted =
    resolutionType === "group_question" &&
    !isNil(resolution) &&
    highlightedOptionId !== id;

  const forecastColumnValue = useMemo(() => {
    if (resolutionType === "group_question" && !isNil(resolution)) {
      return (
        <div className="flex items-center capitalize">
          <ResolutionIcon /> {resolution}
        </div>
      );
    }

    return (
      <>
        {communityForecast ? (
          getForecastPctDisplayValue(communityForecast)
        ) : (
          <span className="opacity-35">—</span>
        )}
      </>
    );
  }, [communityForecast, resolution, resolutionType]);

  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(inputDisplayValue);
    }
  }, [inputDisplayValue, isInputFocused]);

  const handleSliderForecastChange = useCallback(
    (value: number) => {
      onChange(id, value);
    },
    [id, onChange]
  );
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);
  const handleInputForecastChange = useCallback(
    (value: number) => {
      onChange(id, value);
    },
    [id, onChange]
  );

  const SliderElement = (
    <div className="sm:ml-5 sm:mr-7">
      <Slider
        inputMin={inputMin}
        inputMax={inputMax}
        defaultValue={disabled ? 0 : forecastValue ?? defaultSliderValue}
        onChange={handleSliderForecastChange}
        step={1}
        arrowStep={0.1}
        shouldSyncWithDefault
        arrowClassName={cn(
          "text-orange-700 hover:text-orange-800 active:text-orange-900 dark:text-orange-700-dark dark:hover:text-orange-800-dark dark:active:text-orange-900-dark",
          isRowDirty
            ? "bg-orange-200 dark:bg-orange-200-dark"
            : "bg-gray-0 dark:bg-gray-0-dark"
        )}
        marks={
          communityForecast
            ? {
                [communityForecast * 100]: <MarkArrow color={choiceColor} />,
              }
            : undefined
        }
        disabled={disabled}
        styles={
          disabled
            ? {
                handle: { display: "none" },
                rail: {
                  height: "1px",
                  opacity: 0.35,
                  backgroundColor: getThemeColor(METAC_COLORS.gray["1000"]),
                },
              }
            : {}
        }
      />
    </div>
  );

  return (
    <>
      <tr
        className={cn({
          "bg-orange-200 dark:bg-orange-200-dark": isRowDirty,
          "bg-blue-200 bg-fixed dark:bg-blue-200-dark":
            highlightedOptionId === id,
          "bg-gradient-to-r from-purple-200 to-gray-0 bg-fixed dark:from-purple-200-dark dark:to-gray-0-dark":
            isQuestionResolved || isGroupResolutionHighlighted,
        })}
        onClick={() => onOptionClick?.(id)}
      >
        <th className="w-full border-t border-gray-300 px-3 py-2 text-left text-sm font-medium leading-6 dark:border-gray-300-dark sm:w-auto sm:min-w-[10rem] sm:text-base">
          <div className="flex gap-2">
            <ChoiceIcon className="mt-1 shrink-0" color={choiceColor} />
            <div className="flex flex-col">
              {isQuestionResolved && (
                <span className="text-xs uppercase text-purple-700 dark:text-purple-700-dark">
                  {t("resolved")}
                </span>
              )}
              {choiceName}
            </div>
          </div>
        </th>
        <td className="border-t border-gray-300 p-2 text-right text-sm font-medium dark:border-gray-300-dark">
          {forecastColumnValue}
        </td>
        <td className="border-t border-gray-300 px-3 text-center dark:border-gray-300-dark sm:px-2 sm:py-2">
          <ForecastTextInput
            onChange={handleInputChange}
            onForecastChange={handleInputForecastChange}
            isDirty={isDirty}
            minValue={inputMin}
            maxValue={inputMax}
            value={inputValue}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            disabled={disabled}
          />
        </td>
        <td className="hidden w-full border-t border-gray-300 p-2 dark:border-gray-300-dark sm:table-cell">
          <div className="flex">
            <div className="w-full">{SliderElement}</div>
            <div>{menu}</div>
          </div>
        </td>
      </tr>
      <tr
        className={cn("sm:hidden", {
          "bg-orange-200 dark:bg-orange-200-dark": isRowDirty,
        })}
        onClick={() => onOptionClick?.(id)}
      >
        <td
          className={cn(
            "w-full border-t border-none border-gray-300 px-3 py-2 pt-0 dark:border-gray-300-dark sm:px-6",
            { "hidden sm:table-cell": disabled }
          )}
          colSpan={4}
        >
          {SliderElement}
        </td>
      </tr>
    </>
  );
};

const MarkArrow: FC<{
  color: ThemeColor;
}> = ({ color }) => {
  const { getThemeColor } = useAppTheme();
  const mounted = useMounted();

  return (
    <svg
      className={cn("absolute top-0.5 -translate-x-1/2")}
      width="12"
      height="8"
      viewBox="0 0 12 8"
      fill="none"
    >
      <path
        d="M5.99984 8L11.9998 0H-0.000158574L5.99984 8Z"
        fill={mounted ? getThemeColor(color) : color.DEFAULT}
      />
    </svg>
  );
};

export default ForecastChoiceOption;

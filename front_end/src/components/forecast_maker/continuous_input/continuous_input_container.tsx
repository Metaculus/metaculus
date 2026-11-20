import { useTranslations } from "next-intl";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";

import {
  ContinuousAreaGraphType,
  ContinuousForecastInputType,
} from "@/types/charts";
import { QuestionType, NumericUserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";

import ContinuousInputModeSwitcher from "./continuous_input_mode_switcher";
import ContinuousInputOptions from "./continuous_input_options";
import {
  DistributionClipboardData,
  useDistributionClipboard,
} from "./use_distribution_clipboard";

export type ContinuousInputContainerProps = {
  forecastInputMode: ContinuousForecastInputType;
  onInputModeChange: (mode: ContinuousForecastInputType) => void;
  overlayPreviousForecast: boolean;
  onOverlayPreviousForecastChange: (value: boolean) => void;
  previousForecast?: NumericUserForecast;
  menu?: ReactNode;
  copyMenu?: ReactNode;
  clipboardData?: DistributionClipboardData;
  children?: (
    sliderGraphType: ContinuousAreaGraphType,
    tableGraphType: ContinuousAreaGraphType
  ) => ReactNode;
  disabled?: boolean;
  questionType: QuestionType;
};

const ContinuousInputContainer: FC<ContinuousInputContainerProps> = ({
  forecastInputMode,
  onInputModeChange,
  overlayPreviousForecast,
  previousForecast,
  onOverlayPreviousForecastChange,
  menu,
  copyMenu,
  clipboardData,
  children,
  disabled,
  questionType,
}) => {
  const t = useTranslations();
  const clipboard = useDistributionClipboard({
    data: clipboardData,
    forecastInputMode,
    disabled,
  });

  const [sliderGraphType, setSliderGraphType] =
    useState<ContinuousAreaGraphType>("pmf");
  const [tableGraphType, setTableGraphType] =
    useState<ContinuousAreaGraphType>("pmf");
  const activeGraphType = useMemo(() => {
    if (forecastInputMode === ContinuousForecastInputType.Slider) {
      return sliderGraphType;
    }
    return tableGraphType;
  }, [forecastInputMode, sliderGraphType, tableGraphType]);
  const handleGraphTypeChange = useCallback(
    (graphType: ContinuousAreaGraphType) => {
      if (forecastInputMode === ContinuousForecastInputType.Slider) {
        setSliderGraphType(graphType);
      } else {
        setTableGraphType(graphType);
      }
    },
    [forecastInputMode]
  );

  return (
    <div
      onKeyDown={clipboard?.onKeyDown}
      className="mr-0 flex flex-col sm:mr-2"
      tabIndex={-1}
    >
      <div className={cn("flex justify-between", disabled && "justify-end")}>
        {!disabled && (
          <ContinuousInputModeSwitcher
            mode={forecastInputMode}
            onChange={onInputModeChange}
          />
        )}
        <div className="flex items-center gap-2 self-start">
          <ContinuousInputOptions
            graph={{
              densityLabel:
                questionType === QuestionType.Discrete ? t("pmf") : t("pdf"),
              isCdf: activeGraphType === "cdf",
              onChange: (isCdf) => handleGraphTypeChange(isCdf ? "cdf" : "pmf"),
              description:
                (questionType === QuestionType.Discrete
                  ? "PMF (Probability Mass Function) shows how likely different specific outcomes are,"
                  : "PDF (Probability Density Function) shows how likely different outcomes are around specific values,") +
                " while CDF (Cumulative Distribution Function) shows the cumulative probability of outcomes up to a certain value.",
            }}
            overlayPrevious={
              !!previousForecast && !disabled
                ? {
                    label: !isForecastActive(previousForecast)
                      ? t("overlayMostRecentForecast")
                      : t("overlayCurrentForecast"),
                    checked: overlayPreviousForecast,
                    onChange: onOverlayPreviousForecastChange,
                  }
                : undefined
            }
            clipboard={clipboard ?? undefined}
            subquestionCopyMenu={copyMenu}
          />
          {/* Subquestion actions rather than input options, so not in the
              options panel */}
          {menu && (
            <div className="size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
              {menu}
            </div>
          )}
        </div>
      </div>
      {children?.(sliderGraphType, tableGraphType)}
    </div>
  );
};

export default ContinuousInputContainer;

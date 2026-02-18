import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";
import {
  ContinuousAreaGraphType,
  ContinuousForecastInputType,
} from "@/types/charts";
import { QuestionType, NumericUserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";

import ContinuousInputModeSwitcher from "./continuous_input_mode_switcher";

export type ContinuousInputContainerProps = {
  forecastInputMode: ContinuousForecastInputType;
  onInputModeChange: (mode: ContinuousForecastInputType) => void;
  overlayPreviousForecast: boolean;
  onOverlayPreviousForecastChange: (value: boolean) => void;
  previousForecast?: NumericUserForecast;
  menu?: ReactNode;
  copyMenu?: ReactNode;
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
  children,
  disabled,
  questionType,
}) => {
  const t = useTranslations();

  const [sliderGraphType, setSliderGraphType] =
    useState<ContinuousAreaGraphType>("pmf");
  const [tableGraphType, setTableGraphType] =
    useState<ContinuousAreaGraphType>("cdf");
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
    <div className="mr-0 flex flex-col sm:mr-2">
      <div className={cn("flex justify-between", disabled && "justify-end")}>
        {!disabled && (
          <ContinuousInputModeSwitcher
            mode={forecastInputMode}
            onChange={onInputModeChange}
          />
        )}
        <div className="flex flex-col items-center gap-2 self-end">
          <div className="flex w-fit flex-row items-center gap-2 self-end">
            <p
              className={cn(
                "m-0 text-sm",
                activeGraphType === "cdf" ? "opacity-60" : "opacity-90"
              )}
              title="probability density function"
            >
              {questionType === QuestionType.Discrete ? t("pmf") : t("pdf")}
            </p>
            <Switch
              checked={activeGraphType === "cdf"}
              onChange={(checked) =>
                handleGraphTypeChange(checked ? "cdf" : "pmf")
              }
            />
            <p
              className={cn(
                "m-0 text-sm",
                activeGraphType === "cdf" ? "opacity-90" : "opacity-60"
              )}
              title="cumulative density function"
            >
              {t("cdf")}
            </p>
            <Tooltip
              showDelayMs={200}
              placement={"bottom"}
              renderInPortal={false}
              tooltipContent={
                (questionType === QuestionType.Discrete
                  ? "PMF (Probability Mass Function) shows how likely different specific outcomes are,"
                  : "PDF (Probability Density Function) shows how likely different outcomes are around specific values,") +
                " while CDF (Cumulative Distribution Function) shows the cumulative probability of outcomes up to a certain value."
              }
              className=""
              tooltipClassName="text-center !max-w-[331px] !border-blue-400 dark:!border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark !text-base !p-4"
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
                height={16}
                className="text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
              />
            </Tooltip>
            <div className="flex gap-3">
              {copyMenu && (
                <div className="-mr-2 size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
                  {copyMenu}
                </div>
              )}
              {menu && (
                <div className="-mr-2 size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
                  {menu}
                </div>
              )}
            </div>
          </div>
          {!!previousForecast && (
            <div className="ml-auto mr-auto mt-1 flex items-center md:-mr-1">
              <Checkbox
                checked={overlayPreviousForecast}
                onChange={onOverlayPreviousForecastChange}
                className={
                  "flex flex-row gap-2 text-sm text-gray-700 dark:text-gray-700-dark md:flex-row-reverse "
                }
                label={
                  !isForecastActive(previousForecast)
                    ? t("overlayMostRecentForecast")
                    : t("overlayCurrentForecast")
                }
              />
            </div>
          )}
        </div>
      </div>
      {children?.(sliderGraphType, tableGraphType)}
    </div>
  );
};

export default ContinuousInputContainer;

"use client";
import { faCircleQuestion, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useState } from "react";

import MultiSlider from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import Checkbox from "@/components/ui/checkbox";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousAreaGraphType, ForecastInputType } from "@/types/charts";
import {
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/cn";

import ContinuousPredictionChart from "./continuous_prediction_chart";
import SliderInputModeSwitcher from "./continuous_slider_input_mode_switcher";
import { useHideCP } from "../cp_provider";

type Props = {
  components: DistributionSliderComponent[];
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  onChange: (components: DistributionSliderComponent[]) => void;
  overlayPreviousForecast: boolean;
  setOverlayPreviousForecast: (value: boolean) => void;
  question: QuestionWithNumericForecasts;
  disabled?: boolean;
  showInputModeSwitcher?: boolean;
  forecastInputMode?: ForecastInputType;
  setForecastInputMode?: (mode: ForecastInputType) => void;
  menu?: ReactNode;
};

const ContinuousSlider: FC<Props> = ({
  components,
  dataset,
  onChange,
  overlayPreviousForecast,
  setOverlayPreviousForecast,
  question,
  disabled = false,
  showInputModeSwitcher = false,
  forecastInputMode = "slider",
  setForecastInputMode = () => {},
  menu,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const [graphType, setGraphType] = useState<ContinuousAreaGraphType>("pmf");

  const previousForecast = question.my_forecasts?.latest;

  return (
    <div className="mr-0 flex flex-col sm:mr-2">
      {/* TODO: uncomment when we have a table input mode */}
      {/* <div className="flex justify-between"> */}
      {showInputModeSwitcher && (
        <SliderInputModeSwitcher
          mode={forecastInputMode}
          setMode={setForecastInputMode}
        />
      )}
      <div className="flex flex-col items-center gap-2 self-end">
        <div className="flex w-fit flex-row items-center gap-2 self-end">
          <p
            className={cn(
              "m-0 text-sm",
              graphType === "cdf" ? "opacity-60" : "opacity-90"
            )}
            title="probability density function"
          >
            {t("pdf")}
          </p>
          <Switch
            checked={graphType === "cdf"}
            onChange={(checked) => setGraphType(checked ? "cdf" : "pmf")}
          />
          <p
            className={cn(
              "m-0 text-sm",
              graphType === "cdf" ? "opacity-90" : "opacity-60"
            )}
            title="cumulative density function"
          >
            {t("cdf")}
          </p>
          <Tooltip
            showDelayMs={200}
            placement={"bottom"}
            tooltipContent="PDF (Probability Density Function) shows how likely different outcomes are around specific values, while CDF (Cumulative Distribution Function) shows the cumulative probability of outcomes up to a certain value."
            className=""
            tooltipClassName="text-center !max-w-[331px] !border-blue-400 dark:!border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark !text-base !p-4"
          >
            <FontAwesomeIcon
              icon={faCircleQuestion}
              height={16}
              className="text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
            />
          </Tooltip>
          {menu && (
            <div className="-mr-2 size-[26px] rounded-full bg-gray-100 dark:bg-gray-100-dark">
              {menu}
            </div>
          )}
        </div>
        {previousForecast && (
          <div className="ml-auto mr-auto mt-1 flex items-center md:-mr-1">
            <Checkbox
              checked={overlayPreviousForecast}
              onChange={(checked) => setOverlayPreviousForecast(checked)}
              className={
                "flex flex-row gap-2 text-sm text-gray-700 dark:text-gray-700-dark md:flex-row-reverse "
              }
              label={
                !!previousForecast.end_time
                  ? t("overlayMostRecentForecast")
                  : t("overlayCurrentForecast")
              }
            ></Checkbox>
          </div>
        )}
      </div>
      {/* </div> */}
      {forecastInputMode === "slider" ? (
        <>
          <ContinuousPredictionChart
            dataset={dataset}
            graphType={graphType}
            overlayPreviousForecast={overlayPreviousForecast}
            question={question}
            readOnly={disabled}
            showCP={!user || !hideCP || !!question.resolution}
          />
          {!disabled &&
            components.map((forecastValue, index) => {
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
      ) : (
        <div>There will be a table input slider</div>
      )}
    </div>
  );
};

export default ContinuousSlider;

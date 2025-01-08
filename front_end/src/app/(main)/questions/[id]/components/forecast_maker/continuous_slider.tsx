"use client";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import Checkbox from "@/components/ui/checkbox";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousAreaGraphType } from "@/types/charts";
import { QuestionWithNumericForecasts } from "@/types/question";

import ContinuousPredictionChart from "./continuous_prediction_chart";
import { useHideCP } from "../cp_provider";

type Props = {
  forecast: MultiSliderValue[];
  weights: number[];
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  onChange: (forecast: MultiSliderValue[], weights: number[]) => void;
  overlayPreviousForecast: boolean;
  setOverlayPreviousForecast: (value: boolean) => void;
  question: QuestionWithNumericForecasts;
  disabled?: boolean;
};

const ContinuousSlider: FC<Props> = ({
  forecast,
  weights,
  dataset,
  onChange,
  overlayPreviousForecast,
  setOverlayPreviousForecast,
  question,
  disabled = false,
}) => {
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const t = useTranslations();
  const [graphType, setGraphType] = useState<ContinuousAreaGraphType>("pmf");
  const previousForecast = question.my_forecasts?.latest;

  const isGroupQuestion = question.label !== "";
  const isConditionalQuestion =
    question.title.includes("(No)") || question.title.includes("(Yes)");
  const shouldHaveMargins = !isGroupQuestion && !isConditionalQuestion;

  return (
    <div
      className={classNames(
        "mr-0 flex flex-col sm:mr-2",
        shouldHaveMargins ? "mt-[-36px] md:mt-[-28px]" : ""
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex w-fit flex-row items-center gap-2 self-end">
          <p
            className={classNames(
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
            className={classNames(
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
        </div>
        {previousForecast && (
          <div className="ml-auto mr-auto mt-1 flex items-center md:mr-[-4px]">
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
      <ContinuousPredictionChart
        dataset={dataset}
        graphType={graphType}
        overlayPreviousForecast={overlayPreviousForecast}
        question={question}
        readOnly={disabled}
        showCP={!user || !hideCP || !!question.resolution}
      />
      {!disabled &&
        forecast.map((x, index) => {
          const forecastValue = forecast[index];
          const weightValue = weights[index];

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
                      ...forecast.slice(0, index),
                      {
                        left: value.left,
                        center: value.center,
                        right: value.right,
                      },
                      ...forecast.slice(index + 1, forecast.length),
                    ];
                    onChange(newForecast, weights);
                  }}
                  shouldSyncWithDefault
                />
              )}

              {!!forecast.length && !isNil(weightValue) && (
                <div className="flex flex-row justify-between">
                  <span className="inline pr-2 pt-2">weight:</span>
                  <div className="inline w-3/4">
                    <Slider
                      key={`slider-${index}`}
                      inputMin={0}
                      inputMax={1}
                      step={0.00001}
                      defaultValue={weightValue}
                      round={true}
                      onChange={(value) => {
                        const newWeights = [
                          ...weights.slice(0, index),
                          value,
                          ...weights.slice(index + 1, forecast.length),
                        ];
                        onChange(forecast, newWeights);
                      }}
                      disabled={disabled}
                      shouldSyncWithDefault
                    />
                  </div>
                  <FontAwesomeIcon
                    className="inline cursor-pointer pl-2 pt-2"
                    icon={faClose}
                    onClick={() => {
                      const newForecast = [
                        ...forecast.slice(0, index),
                        ...forecast.slice(index + 1, forecast.length),
                      ];
                      const newWeights = [
                        ...weights.slice(0, index),
                        ...weights.slice(index + 1, forecast.length),
                      ];
                      onChange(newForecast, newWeights);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default ContinuousSlider;

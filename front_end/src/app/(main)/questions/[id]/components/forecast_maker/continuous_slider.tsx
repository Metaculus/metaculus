"use client";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import Checkbox from "@/components/ui/checkbox";
import InlineSelect from "@/components/ui/inline_select";
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

  return (
    <div>
      <div className="mb-2 flex items-center">
        <InlineSelect<ContinuousAreaGraphType>
          options={[
            { label: t("pdfLabel"), value: "pmf" },
            { label: t("cdfLabel"), value: "cdf" },
          ]}
          defaultValue={graphType}
          className="appearance-none border-none !p-0 text-sm"
          onChange={(e) =>
            setGraphType(e.target.value as ContinuousAreaGraphType)
          }
        />
        {previousForecast && (
          <div className="ml-auto flex items-center">
            <Checkbox
              checked={overlayPreviousForecast}
              onChange={(checked) => setOverlayPreviousForecast(checked)}
              className={"text-sm"}
              label={t("overlayPreviousForecast")}
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
          return (
            <div className="px-2.5" key={index}>
              <MultiSlider
                disabled={disabled}
                key={`multi-slider-${index}`}
                value={forecast[index]}
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
              {forecast.length > 1 ? (
                <div className="flex flex-row justify-between">
                  <span className="inline pr-2 pt-2">weight:</span>
                  <div className="inline w-3/4">
                    <Slider
                      key={`slider-${index}`}
                      inputMin={0}
                      inputMax={1}
                      step={0.00001}
                      defaultValue={weights[index]}
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
              ) : null}
            </div>
          );
        })}
    </div>
  );
};

export default ContinuousSlider;

"use client";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import NumericAreaChart, {
  AreaGraphType,
} from "@/components/charts/numeric_area_chart";
import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import InlineSelect from "@/components/ui/inline_select";
import { QuestionWithNumericForecasts } from "@/types/question";

type Props = {
  forecast: MultiSliderValue[];
  weights: number[];
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  onChange: (forecast: MultiSliderValue[], weights: number[]) => void;
  question: QuestionWithNumericForecasts;
};

const NumericSlider: FC<Props> = ({
  forecast,
  weights,
  dataset,
  onChange,
  question,
}) => {
  const t = useTranslations();
  const [graphType, setGraphType] = useState<AreaGraphType>("pmf");

  return (
    <div>
      <InlineSelect<AreaGraphType>
        options={[
          { label: t("pdfLabel"), value: "pmf" },
          { label: t("cdfLabel"), value: "cdf" },
        ]}
        defaultValue={graphType}
        className="appearance-none border-none !p-0 text-sm"
        onChange={(e) => setGraphType(e.target.value as AreaGraphType)}
      />
      <NumericAreaChart
        height={300}
        rangeMin={question.range_min}
        rangeMax={question.range_max}
        zeroPoint={question.zero_point}
        dataType={question.type}
        graphType={graphType}
        data={[
          {
            pmf: question.forecasts.latest_pmf,
            cdf: question.forecasts.latest_cdf,
            color: "green",
          },
          {
            pmf: dataset.pmf,
            cdf: dataset.cdf,
            color: "orange",
          },
        ]}
      />
      {forecast.map((x, index) => {
        return (
          <div className="px-2.5" key={index}>
            <MultiSlider
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
                      const newWeights = normWeights([
                        ...weights.slice(0, index),
                        value,
                        ...weights.slice(index + 1, forecast.length),
                      ]);
                      onChange(forecast, newWeights);
                    }}
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
                    const newWeights = normWeights([
                      ...weights.slice(0, index),
                      ...weights.slice(index + 1, forecast.length),
                    ]);
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

function normWeights(weights: number[]) {
  return weights.map((x) => x / weights.reduce((a, b) => a + b));
}

export default NumericSlider;

import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import NumericPickerChart from "@/components/charts/numeric_area_chart";
import MultiSlider, {
  MultiSliderValue,
} from "@/components/sliders/multi_slider";
import Slider from "@/components/sliders/slider";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";

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
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  if (isForecastEmpty) {
    return null;
  }

  return (
    <div>
      <NumericPickerChart
        height={300}
        min={question.min}
        max={question.max}
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
          <div key={index}>
            <MultiSlider
              key={`multi-slider-${index}`}
              min={0}
              max={1}
              value={forecast[index]}
              step={0.00001}
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
                    min={0}
                    max={1}
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

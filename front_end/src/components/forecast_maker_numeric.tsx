"use client";

import { FC, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import NumericPickerChart from "@/components/charts/numeric_picker_chart";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";
import { binWeightsFromSliders, computeQuartilesFromCDF } from "@/utils/math";

import MultiSlider, { MultiSliderValue } from "./sliders/multi_slider";

type Props = {
  question: QuestionWithForecasts;
  prevSlider: MultiSliderValue | null;
};

const ForecastMakerNumeric: FC<Props> = ({ question, prevSlider }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  const [forecast, setForecast] = useState<MultiSliderValue>({
    left: prevSlider ? prevSlider.left : 0.4,
    center: prevSlider ? prevSlider.center : 0.5,
    right: prevSlider ? prevSlider.right : 0.6,
    weight: 1,
  });

  const dataset = binWeightsFromSliders(
    forecast.left,
    forecast.center,
    forecast.right
  );
  const quantiles = computeQuartilesFromCDF(dataset.cdf);

  if (isForecastEmpty) {
    return <div></div>;
  }

  return (
    <div>
      <NumericPickerChart
        dataset={dataset.pmf}
        min={question.min}
        max={question.max}
        upper75={quantiles.upper75}
        median={quantiles.median}
        lower25={quantiles.lower25}
      ></NumericPickerChart>
      <MultiSlider
        min={0}
        max={1}
        value={
          prevSlider
            ? prevSlider
            : {
                left: 0.4,
                right: 0.6,
                center: 0.5,
                weight: 1,
              }
        }
        step={0.00001}
        onChange={setForecast}
      />
      <div className="p-6 text-center">
        <div className="mb-4">
          <button className="mr-2 rounded-lg bg-gray-600 px-4 py-2 text-white">
            Add Component
          </button>
          <button
            className="rounded-lg bg-blue-300 px-4 py-2 text-gray-800"
            onClick={async () => {
              await createForecast(question.id, {
                continuousCdf: dataset.cdf,
                probabilityYes: null,
                probabilityYesPerCategory: null,
                sliders: [forecast],
              });
            }}
          >
            Predict
          </button>
        </div>
        <div className="mb-4 flex justify-between text-center">
          <div className="w-full"></div>
          <div className="text-m w-full text-orange-300">My Prediction</div>
          <a className="text-m w-full text-green-200">Community</a>
        </div>
        <div className="mb-4 flex justify-between">
          <div className="w-full text-center">
            <div className="w-full text-gray-300">lower 25%</div>
            <div className="w-full  text-gray-300">median</div>
            <div className="w-full  text-gray-300">upper 75%</div>
          </div>
          <div className="w-full text-center">
            <div className="text-gray-300">
              {Math.round(quantiles.lower25 * 1000) / 100}
            </div>
            <div className="text-gray-300">
              {Math.round(quantiles.median * 1000) / 100}
            </div>
            <div className="text-gray-300">
              {Math.round(quantiles.upper75 * 1000) / 100}
            </div>
          </div>
          <div className="w-full text-center">
            <div className="text-gray-300">2.10</div>
            <div className="text-gray-300">2.88</div>
            <div className="text-gray-300">3.90</div>
          </div>
        </div>
        <button className="rounded-lg bg-gray-600 px-4 py-2 text-white">
          RESOLVE
        </button>
      </div>
    </div>
  );
};

export default ForecastMakerNumeric;

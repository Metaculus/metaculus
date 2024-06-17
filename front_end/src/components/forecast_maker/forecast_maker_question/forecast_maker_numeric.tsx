"use client";
import { FC, useMemo, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import NumericSlider from "@/components/forecast_maker/numeric_slider";
import NumericForecastTable from "@/components/forecast_maker/numeric_table";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
};

const ForecastMakerNumeric: FC<Props> = ({ question, prevForecast }) => {
  const prevForecastValue = extractPrevNumericForecastValue(prevForecast);

  const [forecast, setForecast] = useState<MultiSliderValue[]>(
    prevForecastValue?.forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
  const [weights, setWeights] = useState<number[]>(
    prevForecastValue?.weights ?? [1]
  );

  const dataset = useMemo(
    () => getNumericForecastDataset(forecast, weights),
    [forecast, weights]
  );

  return (
    <>
      <NumericSlider
        forecast={forecast}
        weights={weights}
        dataset={dataset}
        onChange={(forecast, weight) => {
          setForecast(forecast);
          setWeights(weight);
        }}
        question={question}
      />

      <div className="p-6 text-center">
        <div className="mb-4">
          <button
            className="mr-2 rounded-lg bg-gray-600 px-4 py-2 text-white"
            onClick={() => {
              setForecast([
                ...forecast,
                {
                  left: 0.4,
                  right: 0.6,
                  center: 0.5,
                },
              ]);
              setWeights(normalizeWeights([...weights, 1]));
            }}
          >
            Add Component
          </button>
          <button
            className="rounded-lg bg-blue-300 px-4 py-2 text-gray-800"
            onClick={async () => {
              await createForecast(
                question.id,
                {
                  continuousCdf: dataset.cdf,
                  probabilityYes: null,
                  probabilityYesPerCategory: null,
                },
                {
                  forecast: forecast,
                  weights: weights,
                }
              );
            }}
          >
            Predict
          </button>
        </div>
        <NumericForecastTable
          cdf={dataset.cdf}
          latestCdf={question.forecasts.latest_cdf}
        />
      </div>
    </>
  );
};

function normalizeWeights(weights: number[]) {
  return weights.map((x) => x / weights.reduce((a, b) => a + b));
}

export default ForecastMakerNumeric;

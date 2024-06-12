"use client";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as math from "mathjs";
import { FC, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import NumericPickerChart from "@/components/charts/numeric_picker_chart";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getIsForecastEmpty } from "@/utils/forecasts";
import { binWeightsFromSliders, computeQuartilesFromCDF } from "@/utils/math";

import MultiSlider, { MultiSliderValue } from "../sliders/multi_slider";
import Slider from "../sliders/slider";

type Props = {
  question: QuestionWithNumericForecasts;
  prevSlider: MultiSliderValue | null;
};

function normWeights(weights: number[]) {
  return weights.map((x) => x / weights.reduce((a, b) => a + b));
}

const ForecastMakerNumeric: FC<Props> = ({ question, prevSlider }) => {
  const isForecastEmpty = getIsForecastEmpty(question.forecasts);

  const [forecast, setForecast] = useState<MultiSliderValue[]>([
    {
      left: prevSlider ? prevSlider.left : 0.4,
      center: prevSlider ? prevSlider.center : 0.5,
      right: prevSlider ? prevSlider.right : 0.6,
    },
  ]);
  const [weights, setWeights] = useState<number[]>([1]);

  // @ts-ignore
  const dataset: { cdf: number[]; pmf: number[] } = forecast
    .map((x) => binWeightsFromSliders(x.left, x.center, x.right))
    .map((x, index) => {
      return {
        // @ts-ignore
        pmf: math.multiply(x.pmf, weights[index]),
        // @ts-ignore
        cdf: math.multiply(x.cdf, weights[index]),
      };
    })
    .reduce((acc, curr) => {
      return {
        pmf: math.add(acc.pmf, curr.pmf),
        cdf: math.add(acc.cdf, curr.cdf),
      };
    });

  dataset.pmf = dataset.pmf.map((x) => Number(x));
  dataset.cdf = dataset.cdf.map((x) => Number(x));

  const quantiles = computeQuartilesFromCDF(dataset.cdf);
  question.forecasts.latest_pmf = question.forecasts.latest_pmf
    ? question.forecasts.latest_pmf
    : [];
  question.forecasts.latest_cdf = question.forecasts.latest_cdf
    ? question.forecasts.latest_cdf
    : [];
  const cp_quantiles = computeQuartilesFromCDF(question.forecasts.latest_cdf);
  if (isForecastEmpty) {
    return <div></div>;
  }

  const data = [
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
  ];

  return (
    <div>
      <NumericPickerChart min={question.min} max={question.max} data={data} />
      {forecast.map((x, index) => {
        return (
          <div key={index}>
            <MultiSlider
              key={`multi-slider-${index}`}
              min={0}
              max={1}
              value={
                prevSlider
                  ? prevSlider
                  : {
                      left: 0.4,
                      right: 0.6,
                      center: 0.5,
                    }
              }
              step={0.00001}
              onChange={(value) =>
                setForecast([
                  ...forecast.slice(0, index),
                  {
                    left: value.left,
                    center: value.center,
                    right: value.right,
                  },
                  ...forecast.slice(index + 1, forecast.length),
                ])
              }
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
                    defaultValue={0.5}
                    round={true}
                    onChange={(value) =>
                      setWeights(
                        normWeights([
                          ...weights.slice(0, index),
                          value,
                          ...weights.slice(index + 1, forecast.length),
                        ])
                      )
                    }
                  />
                </div>
                <FontAwesomeIcon
                  className="inline cursor-pointer pl-2 pt-2"
                  icon={faClose}
                  onClick={() => {
                    setForecast([
                      ...forecast.slice(0, index),
                      ...forecast.slice(index + 1, forecast.length),
                    ]);
                    setWeights(
                      normWeights([
                        ...weights.slice(0, index),
                        ...weights.slice(index + 1, forecast.length),
                      ])
                    );
                  }}
                ></FontAwesomeIcon>
              </div>
            ) : null}
          </div>
        );
      })}

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
              setWeights(normWeights([...weights, 1]));
            }}
          >
            Add Component
          </button>
          <button
            className="rounded-lg bg-blue-300 px-4 py-2 text-gray-800"
            onClick={async () => {
              await createForecast(question.id, {
                continuousCdf: dataset.cdf,
                probabilityYes: null,
                probabilityYesPerCategory: null,
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
            <div className="text-gray-300">
              {Math.round(cp_quantiles.lower25 * 1000) / 100}
            </div>
            <div className="text-gray-300">
              {Math.round(cp_quantiles.median * 1000) / 100}
            </div>
            <div className="text-gray-300">
              {Math.round(cp_quantiles.upper75 * 1000) / 100}
            </div>
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

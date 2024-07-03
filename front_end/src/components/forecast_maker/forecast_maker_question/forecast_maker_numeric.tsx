"use client";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import NumericSlider from "@/components/forecast_maker/numeric_slider";
import NumericForecastTable from "@/components/forecast_maker/numeric_table";
import QuestionResolutionButton from "@/components/forecast_maker/resolution";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
  normalizeWeights,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  question: QuestionWithNumericForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerNumeric: FC<Props> = ({
  question,
  permission,
  prevForecast,
  canPredict,
  canResolve,
}) => {
  const prevForecastValue = extractPrevNumericForecastValue(prevForecast);
  const t = useTranslations();

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
          {canPredict && (
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
              {t("MakePrediction")}
            </button>
          )}
        </div>
        <NumericForecastTable
          userQuartiles={computeQuartilesFromCDF(dataset.cdf)}
          communityQuartiles={computeQuartilesFromCDF(
            question.forecasts.latest_cdf
          )}
        />
      </div>
      {canResolve && (
        <div className="flex flex-col items-center justify-center">
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        </div>
      )}
    </>
  );
};

export default ForecastMakerNumeric;

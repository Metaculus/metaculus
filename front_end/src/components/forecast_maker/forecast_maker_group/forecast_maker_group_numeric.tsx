"use client";
import { differenceInMilliseconds } from "date-fns";
import { FC, useMemo, useState } from "react";

import GroupForecastTable, {
  ConditionalTableOption,
} from "@/components/forecast_maker/group_forecast_table";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import { extractQuestionGroupName } from "@/utils/questions";

type Props = {
  postId: number;
  questions: QuestionWithNumericForecasts[];
};

const ForecastMakerGroupNumeric: FC<Props> = ({ postId, questions }) => {
  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<
        Record<
          number,
          { forecast?: MultiSliderValue[]; weight?: number[] } | null
        >
      >(
        (acc, question) => ({
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            question.forecasts.my_forecasts?.slider_values
          ),
        }),
        {}
      ),
    [questions]
  );

  const [groupOptions, setGroupOptions] = useState<ConditionalTableOption[]>(
    [...questions]
      .sort((a, b) =>
        differenceInMilliseconds(
          new Date(a.resolved_at),
          new Date(b.resolved_at)
        )
      )
      .map((q) => {
        const prevForecast = prevForecastValuesMap[q.id]?.forecast;
        const prevWeight = prevForecastValuesMap[q.id]?.weight;

        return {
          id: q.id,
          name: extractQuestionGroupName(q.title),
          userQuartiles: getUserQuartiles(prevForecast, prevWeight),
          userForecast: getSliderValue(prevForecast),
          userWeights: getWeightsValue(prevWeight),
          communityQuartiles: computeQuartilesFromCDF(q.forecasts.latest_cdf),
          resolution: q.resolution,
          isDirty: false,
        };
      })
  );
  const [activeTableOption, setActiveTableOption] = useState(
    groupOptions.at(0)?.id ?? null
  );

  return (
    <>
      <GroupForecastTable
        value={activeTableOption}
        options={groupOptions}
        onChange={setActiveTableOption}
      />
    </>
  );
};

function getUserQuartiles(forecast?: MultiSliderValue[], weight?: number[]) {
  if (!forecast || !weight) {
    return null;
  }

  const dataset = getNumericForecastDataset(forecast, weight);
  return computeQuartilesFromCDF(dataset.cdf);
}

function getSliderValue(forecast?: MultiSliderValue[]) {
  return (
    forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
}

function getWeightsValue(weights?: number[]) {
  return weights ?? [1];
}

export default ForecastMakerGroupNumeric;

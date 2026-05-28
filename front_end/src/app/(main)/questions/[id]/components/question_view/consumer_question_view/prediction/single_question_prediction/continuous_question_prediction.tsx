"use client";

import { useMemo } from "react";

import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import {
  ContinuousAreaGraphInput,
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import MinifiedContinuousAreaChart from "@/components/charts/minified_continuous_area_chart";
import ConsumerContinuousTile from "@/components/consumer_post_card/consumer_question_tile/consumer_continuous_tile";
import { useContinuousChartCursor } from "@/contexts/continuous_chart_cursor_context";
import { useHideCP } from "@/contexts/cp_context";
import { ContinuousAreaType } from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { cdfToPmf } from "@/utils/math";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";

type Props = {
  question: QuestionWithNumericForecasts;
  chartHeight?: number;
};

const ContinuousQuestionPrediction: React.FC<Props> = ({
  question,
  chartHeight,
}) => {
  const forecastAvailability = getQuestionForecastAvailability(question);
  const cursorCtx = useContinuousChartCursor();
  const cursorForecast = cursorCtx?.activeForecast ?? null;
  const cursorUserForecastValues = cursorCtx?.activeUserForecastValues ?? null;
  const { hideCP } = useHideCP();

  const shouldHideChart =
    forecastAvailability.isEmpty || !!forecastAvailability.cpRevealsOn;

  const continuousAreaChartData = getContinuousAreaChartData({
    question,
    isClosed: question.status === QuestionStatus.CLOSED,
  });

  const cursorForecastValues = cursorForecast?.forecast_values ?? null;

  // Null when cursor is inactive — chart falls back to the latest aggregate.
  const cursorChartData = useMemo<ContinuousAreaGraphInput | null>(() => {
    if (!cursorForecastValues) return null;
    const data: ContinuousAreaGraphInput = [
      {
        pmf: cdfToPmf(cursorForecastValues),
        cdf: cursorForecastValues,
        type: (question.status === QuestionStatus.CLOSED
          ? "community_closed"
          : "community") as ContinuousAreaType,
      },
    ];
    if (cursorUserForecastValues) {
      data.push({
        pmf: cdfToPmf(cursorUserForecastValues),
        cdf: cursorUserForecastValues,
        type: "user",
      });
    }
    return data;
  }, [cursorForecastValues, cursorUserForecastValues, question.status]);

  if (hideCP) {
    return (
      <div className="mx-auto mb-7 flex max-w-[340px] flex-col items-center justify-center gap-2.5">
        <RevealCPButton />
      </div>
    );
  }

  return (
    <div className="mx-auto mb-7 flex max-w-[340px] flex-col items-center gap-2.5">
      <ConsumerContinuousTile
        question={question}
        forecastAvailability={forecastAvailability}
        variant="question"
        overrideCenter={cursorForecast?.centers?.[0] ?? null}
      />
      {!shouldHideChart && (
        <>
          <div className="w-full overflow-visible pb-1 md:pb-4 md:pt-4">
            <div className="origin-center transform-gpu md:scale-150">
              <MinifiedContinuousAreaChart
                question={question}
                data={cursorChartData ?? continuousAreaChartData}
                height={chartHeight ?? 50}
                forceTickCount={2}
                variant="question"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContinuousQuestionPrediction;

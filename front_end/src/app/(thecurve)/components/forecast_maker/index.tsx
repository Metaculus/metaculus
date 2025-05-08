"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/components/forecast_maker/binary_slider";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useServerAction } from "@/hooks/use_server_action";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { generateCurveChoiceOptions } from "@/utils/forecasts/thecurve";
import { canPredictQuestion } from "@/utils/questions/predictions";

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithForecasts[];
  onSkip: () => void;
  onPredict: () => void;
};

const CurveForecastMaker: FC<Props> = ({
  post,
  questions,
  onSkip,
  onPredict,
}) => {
  const t = useTranslations();
  const [questionOptions, setQuestionOptions] = useState(
    generateCurveChoiceOptions(questions)
  );
  const questionsToSubmit = useMemo(
    () =>
      questionOptions.filter(
        (option) =>
          option.forecast !== null && option.status === QuestionStatus.OPEN
      ),
    [questionOptions]
  );
  useEffect(() => {
    setQuestionOptions(generateCurveChoiceOptions(questions));
  }, [questions]);

  const canPredict = canPredictQuestion(post);

  const handleForecastChange = useCallback((id: number, forecast: number) => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => {
        if (prevQuestion.id === id) {
          return { ...prevQuestion, forecast, isDirty: true };
        }

        return prevQuestion;
      })
    );
  }, []);

  const handlePredictSubmit = useCallback(async () => {
    if (!questionsToSubmit.length) {
      return;
    }

    const response = await createForecasts(
      post.id,
      questionsToSubmit.map((q) => {
        const forecastValue = round(
          // okay to use no-non-null-assertion as forecast is checked in questionsToSubmit
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          q.forecast! / 100,
          BINARY_FORECAST_PRECISION
        );

        return {
          questionId: q.id,
          forecastData: {
            probabilityYes: forecastValue,
            probabilityYesPerCategory: null,
            continuousCdf: null,
          },
        };
      }),
      false
    );
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );
    if (!(response && "errors" in response)) {
      onPredict?.();
    }
  }, [post, questionsToSubmit, onPredict]);
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  return (
    <div className="p-5 md:rounded-b md:bg-gray-0 md:dark:bg-gray-0-dark">
      <p className="m-0 text-gray-800 dark:text-gray-800-dark">
        {t("respondCrowdMedian")}
      </p>
      <div className="mt-4 flex w-full flex-col items-center rounded bg-[#A9C0D64D]/30 p-6 dark:bg-[#A9C0D64D]/30">
        {questionOptions.map((option, idx) => (
          <React.Fragment key={`forecast-option-${option.id}`}>
            <p
              className={cn(
                "m-0 text-sm font-medium leading-5 text-gray-900 dark:text-gray-900-dark",
                {
                  "mt-6": idx > 0,
                }
              )}
            >
              {option.label}
            </p>
            <BinarySlider
              className="!m-0 !mt-2 !h-10 w-full"
              forecast={option.forecast}
              onChange={(forecast) => handleForecastChange(option.id, forecast)}
              isDirty={false}
              disabled={!canPredict}
              styles={{
                rail: { backgroundColor: "white", height: "3px" },
                track: { backgroundColor: "white", height: "3px" },
              }}
              withArrowStep={false}
            />
          </React.Fragment>
        ))}

        <div className="h-[24px] w-full">
          {isPending && <LoadingIndicator />}
        </div>
        <Button
          onClick={submit}
          disabled={!canPredict || questionOptions.some((q) => !q.isDirty)}
          className="!px-5 !text-lg"
        >
          {t("predict")}
        </Button>
        <p className="m-0 my-4 text-center text-xs leading-4 text-gray-800 dark:text-gray-800-dark">
          {t("answerAfterEditing")}
        </p>
        <Button
          onClick={onSkip}
          variant="text"
          className="!py-0 !font-normal !text-blue-800 !underline dark:!text-blue-800-dark"
        >
          {t("skipQuestions")}
        </Button>
      </div>

      <div className="mt-4 flex w-full flex-col items-center rounded bg-[#A9C0D64D]/30 p-6 text-center text-gray-700 dark:bg-[#A9C0D64D]/30 dark:text-gray-700-dark">
        {t("histogramAfterPrediction")}
      </div>
    </div>
  );
};

export default CurveForecastMaker;

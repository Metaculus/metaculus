"use client";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useServerAction } from "@/hooks/use_server_action";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { canPredictQuestion } from "@/utils/questions";

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
    generateChoiceOptions(questions)
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
    setQuestionOptions(generateChoiceOptions(questions));
  }, [questions]);

  console.log(post);
  console.log(questionOptions);

  const canPredict = canPredictQuestion(post);

  const handleForecastChange = useCallback((id: number, forecast: number) => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => {
        if (prevQuestion.id === id) {
          return { ...prevQuestion, forecast };
        }

        return prevQuestion;
      })
    );
  }, []);

  const handlePredictSubmit = useCallback(async () => {
    // setSubmitErrors([]);

    if (!questionsToSubmit.length) {
      return;
    }

    const response = await createForecasts(
      post.id,
      questionsToSubmit.map((q) => {
        const forecastValue = round(
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
      }, false)
    );
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );
    if (!(response && "errors" in response)) {
      onPredict && onPredict();
    }
    // const errors: ErrorResponse[] = [];
    // if (response && "errors" in response && !!response.errors) {
    //   for (const response_errors of response.errors) {
    //     errors.push(response_errors);
    //   }
    // }
    // if (response && "error" in response && !!response.error) {
    //   errors.push(response.error);
    // }
    // if (errors.length) {
    //   setSubmitErrors(errors);
    // }
  }, [post, questionsToSubmit, onPredict]);
  // const [submit, isPending] = useServerAction(handlePredictSubmit);

  return (
    <div className="m-5">
      <p className="m-0">{t("respondCrowdMedian")}</p>
      <div className="flex w-full flex-col items-center rounded bg-blue-300 p-6">
        <p className="m-0">Your forecast</p>
        <BinarySlider
          className="!m-0 w-full"
          forecast={questionOptions[0].forecast}
          onChange={(forecast) =>
            handleForecastChange(questionOptions[0].id, forecast)
          }
          isDirty={false}
          disabled={!canPredict}
        />

        <p className="m-0">Your forecast of Crowd Median</p>
        <BinarySlider
          className="!m-0 w-full"
          forecast={questionOptions[1].forecast}
          onChange={(forecast) =>
            handleForecastChange(questionOptions[1].id, forecast)
          }
          isDirty={false}
          disabled={!canPredict}
        />
        {/* <div className="h-[32px] w-full">
          {isPending && <LoadingIndicator />}
        </div> */}
        <Button onClick={handlePredictSubmit} disabled={!canPredict}>
          {t("predict")}
        </Button>
        <p className="m-0">Answers cannot be edited after submission.</p>
        <Button onClick={onSkip} variant="text" className="!underline">
          Skip question
        </Button>
      </div>

      <div className="mt-4 flex w-full flex-col items-center rounded bg-blue-300 p-6">
        Histograms will be revealed once you submit your prediction.
      </div>
    </div>
  );
};

function generateChoiceOptions(questions: QuestionWithForecasts[]) {
  return questions.map((q) => ({
    id: q.id,
    forecast: q.my_forecasts?.latest?.forecast_values[1] ?? null,
    status: q.status,
  }));
}
export default CurveForecastMaker;

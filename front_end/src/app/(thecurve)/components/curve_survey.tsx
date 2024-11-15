"use client";
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";

import { useSurvey } from "@/contexts/survey_context";
import { PostWithForecasts } from "@/types/post";

import CurveHistogramDrawer from "./curve_histogram/curve_histogram_drawer";
import CurveQuestion from "./curve_question";
import CurveForecastMaker from "./forecast_maker";

type Props = {
  questions: PostWithForecasts[];
};

const Survey: FC<Props> = ({ questions }) => {
  const router = useRouter();
  const { questionIndex, setQuestionIndex } = useSurvey();
  const [predicted, setPredicted] = useState(false);

  const nextQuestion = useCallback(
    (questionIndex: number) => {
      questions.length === questionIndex + 1
        ? router.push("/thecurve")
        : setQuestionIndex((prev) => (prev ?? 0) + 1);
    },
    [questions.length, router, setQuestionIndex]
  );
  if (questionIndex === null) {
    router.push("/thecurve");
    return null;
  }
  const activeQuestion = questions[questionIndex];

  return (
    <div className="flex w-full flex-col md:justify-center lg:w-[790px]">
      {activeQuestion && <CurveQuestion post={activeQuestion} />}
      {activeQuestion.group_of_questions?.questions && !predicted && (
        <CurveForecastMaker
          post={activeQuestion}
          questions={activeQuestion.group_of_questions.questions}
          onSkip={() => nextQuestion(questionIndex)}
          onPredict={() => setPredicted(true)}
        />
      )}

      {activeQuestion.group_of_questions?.questions && predicted && (
        <CurveHistogramDrawer
          postId={activeQuestion.id}
          onNextQuestion={() => {
            setPredicted(false);
            nextQuestion(questionIndex);
          }}
        />
      )}
    </div>
  );
};

export default Survey;

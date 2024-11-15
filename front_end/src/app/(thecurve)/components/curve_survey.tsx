"use client";
import { useRouter } from "next/navigation";
import { FC, useCallback, useState } from "react";

import Button from "@/components/ui/button";
import { useSurvey } from "@/contexts/survey_context";
import { PostWithForecasts } from "@/types/post";

import CurveQuestion from "./curve_question";
import CurveForecastMaker from "./forecast_maker";
import CurveHistogram from "./curve_histogram";

type Props = {
  questions: PostWithForecasts[];
};

const Survey: FC<Props> = ({ questions }) => {
  const router = useRouter();
  const { questionIndex, setQuestionIndex } = useSurvey();
  console.log("Survey component questions:", questions);
  console.log(questionIndex);
  const activeQuestion = questions[questionIndex];
  const [predicted, setPredicted] = useState(false);

  const nextQuestion = useCallback(
    (questionIndex: number) => {
      questions.length === questionIndex + 1
        ? router.push("/thecurve")
        : setQuestionIndex((prev) => prev + 1);
    },
    [questions.length, router, setQuestionIndex]
  );
  return (
    <div className="w-full">
      <CurveQuestion post={activeQuestion} />

      {activeQuestion.group_of_questions?.questions && !predicted && (
        <CurveForecastMaker
          post={activeQuestion}
          questions={activeQuestion.group_of_questions.questions}
          onSkip={() => nextQuestion(questionIndex)}
          onPredict={() => setPredicted(true)}
        />
      )}

      {activeQuestion.group_of_questions?.questions && predicted && (
        <>
          <CurveHistogram post={activeQuestion} />
          <Button
            onClick={() => {
              setPredicted(false);
              nextQuestion(questionIndex);
            }}
          >
            Next Question
          </Button>
        </>
      )}
    </div>
  );
};

export default Survey;

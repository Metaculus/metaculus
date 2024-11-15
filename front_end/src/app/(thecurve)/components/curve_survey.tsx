"use client";
import { useRouter } from "next/navigation";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useSurvey } from "@/contexts/survey_context";
import { PostWithForecasts } from "@/types/post";

import CurveQuestion from "./curve_question";

type Props = {
  questions: PostWithForecasts[];
};

const Survey: FC<Props> = ({ questions }) => {
  const { questionIndex, setQuestionIndex } = useSurvey();
  const router = useRouter();
  return (
    <div className="w-full">
      <CurveQuestion question={questions[questionIndex]} />
      <Button
        onClick={() =>
          questions.length === questionIndex + 1
            ? router.push("/thecurve")
            : setQuestionIndex((prev) => prev + 1)
        }
      >
        Skip question
      </Button>
    </div>
  );
};

export default Survey;

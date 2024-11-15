import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import CurveQuestionDetails from "./question_details/curve_question_details";

type Props = {
  question: PostWithForecasts;
};

const CurveQuestion: FC<Props> = ({ question }) => {
  const t = useTranslations();

  return (
    <div className="w-full">
      <div className="max-h-[calc(100vh-48px)] w-full overflow-y-auto bg-blue-800 p-5 pb-3 dark:bg-blue-800-dark">
        <h1 className="m-0 text-2xl font-medium leading-8 text-gray-100 dark:text-gray-100-dark">
          {question.title}
        </h1>
        <CurveQuestionDetails question={question} />
      </div>
    </div>
  );
};

export default CurveQuestion;

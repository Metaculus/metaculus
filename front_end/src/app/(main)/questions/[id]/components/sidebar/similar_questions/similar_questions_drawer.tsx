"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";

import SimilarQuestion from "./similar_question_card";

interface Props {
  questions: PostWithForecasts[];
}

const SimilarQuestionsDrawer: FC<Props> = ({ questions }) => {
  const t = useTranslations();
  const [questionsDisplayLimit, setQuestionsDisplayLimit] = useState(3);

  return (
    <div className="w-full @container">
      <SectionToggle defaultOpen title={t("similarQuestions")}>
        <div className="flex flex-col items-center justify-center gap-2">
          {questions
            .slice(0, questionsDisplayLimit)
            .map((question: PostWithForecasts) => (
              <SimilarQuestion key={question.id} post={question} />
            ))}
          <div className="flex flex-col items-center justify-between @md:flex-row">
            {questions.length > questionsDisplayLimit ? (
              <Button
                variant="tertiary"
                onClick={() => setQuestionsDisplayLimit((prev) => prev + 5)}
              >
                {t("showMoreQuestions")}
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </SectionToggle>
    </div>
  );
};

export default SimilarQuestionsDrawer;

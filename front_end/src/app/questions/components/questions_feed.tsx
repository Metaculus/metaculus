import { getTranslations } from "next-intl/server";
import { FC } from "react";

import QuestionCard from "@/components/question_card";
import QuestionsApi, { QuestionsParams } from "@/services/questions";

type Props = {
  filters: QuestionsParams;
};

const QuestionsFeed: FC<Props> = async ({ filters }) => {
  const t = await getTranslations();

  const questions = await QuestionsApi.getQuestionsWithoutForecasts({
    ...filters,
    limit: 10, // TODO: implement pagination
  });

  return (
    <div className="flex min-h-[calc(100vh-300px)] flex-col gap-3">
      {!questions.length && (
        <span className="mt-3 text-center text-sm text-metac-gray-900 dark:text-metac-gray-900-dark">
          {t("noResults") + "."}
        </span>
      )}
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
      {/*TODO: handle error state*/}
    </div>
  );
};

export default QuestionsFeed;

import { FC } from "react";

import QuestionsFeed from "@/app/questions/components/questions_feed";
import { QUESTIONS_PER_PAGE } from "@/app/questions/constants/pagination";
import QuestionsApi, { QuestionsParams } from "@/services/questions";

type Props = {
  filters: QuestionsParams;
};

const AwaitedQuestions: FC<Props> = async ({ filters }) => {
  const { results: questions, count } =
    await QuestionsApi.getQuestionsWithoutForecasts({
      ...filters,
      limit: QUESTIONS_PER_PAGE,
    });

  return (
    <QuestionsFeed
      filters={filters}
      initialQuestions={questions}
      totalCount={count}
    />
  );
};

export default AwaitedQuestions;

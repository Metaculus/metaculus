import { FC } from "react";

import PaginatedQuestionsFeed from "@/components/questions_feed/paginated_feed";
import { QUESTIONS_PER_PAGE } from "@/constants/questions_feed";
import QuestionsApi, { QuestionsParams } from "@/services/questions";

type Props = {
  filters: QuestionsParams;
};

const AwaitedQuestionsFeed: FC<Props> = async ({ filters }) => {
  const { results: questions, count } =
    await QuestionsApi.getQuestionsWithoutForecasts({
      ...filters,
      limit: QUESTIONS_PER_PAGE,
    });

  return (
    <PaginatedQuestionsFeed
      filters={filters}
      initialQuestions={questions}
      totalCount={count}
    />
  );
};

export default AwaitedQuestionsFeed;

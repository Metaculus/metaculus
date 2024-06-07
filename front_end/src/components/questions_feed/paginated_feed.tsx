"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { fetchMoreQuestions } from "@/app/(main)/questions/actions";
import QuestionCard from "@/components/question_card";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { QUESTIONS_PER_PAGE } from "@/constants/questions_feed";
import { QuestionsParams } from "@/services/questions";
import { QuestionWithForecasts } from "@/types/question";

type Props = {
  initialQuestions: QuestionWithForecasts[];
  totalCount: number;
  filters: QuestionsParams;
};

const PaginatedQuestionsFeed: FC<Props> = ({
  initialQuestions,
  totalCount,
  filters,
}) => {
  const t = useTranslations();

  const [paginatedQuestions, setPaginatedQuestions] =
    useState<QuestionWithForecasts[]>(initialQuestions);
  const [offset, setOffset] = useState(QUESTIONS_PER_PAGE);
  const [hasMoreData, setHasMoreData] = useState(
    initialQuestions.length < totalCount
  );
  const [isLoading, setIsLoading] = useState(false);

  // TODO: handle error case
  const loadMoreQuestions = async () => {
    if (hasMoreData) {
      setIsLoading(true);
      const newQuestions = await fetchMoreQuestions(
        filters,
        offset,
        QUESTIONS_PER_PAGE
      );

      if (newQuestions.length < QUESTIONS_PER_PAGE) {
        setHasMoreData(false);
      }

      setPaginatedQuestions((prevQuestions) => [
        ...prevQuestions,
        ...newQuestions,
      ]);
      setOffset((prevOffset) => prevOffset + QUESTIONS_PER_PAGE);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-300px)] flex-col gap-3">
        {!paginatedQuestions.length && (
          <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
            {t("noResults") + "."}
          </span>
        )}
        {paginatedQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>

      {hasMoreData ? (
        <div className="flex py-5">
          {isLoading ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <Button className="mx-auto" onClick={loadMoreQuestions}>
              Load more
            </Button>
          )}
        </div>
      ) : null}
    </>
  );
};

export default PaginatedQuestionsFeed;

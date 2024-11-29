import { getTranslations } from "next-intl/server";
import React, { FC } from "react";

import NotebookEditor from "@/app/(main)/notebooks/components/notebook_editor";
import CommentFeed from "@/components/comment_feed";
import { SharePostMenu } from "@/components/post_actions";
import PostsApi from "@/services/posts";
import {
  PostWithForecasts,
  PostWithForecastsAndWeight,
  PostWithNotebook,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import { scaleInternalLocation } from "@/utils/charts";

import IndexQuestionsTable from "./index_questions_table";

import "./styles.css";

type Props = {
  postData: PostWithForecasts;
  questionTitle: string;
  questionWeightsMap: Record<string, number>;
  questionIds: number[];
};

const IndexNotebook: FC<Props> = async ({
  postData,
  questionTitle,
  questionWeightsMap,
  questionIds,
}) => {
  const t = await getTranslations();

  const { results: questions } = await PostsApi.getPostsWithCP({
    ids: questionIds,
  });
  const indexQuestions = questions.map((question) => ({
    ...question,
    weight: questionWeightsMap[question.id] || 0,
  }));

  const indexValue = calculateIndex(indexQuestions);

  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-3xl flex-1 flex-col bg-gray-0 text-base text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark">
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-t bg-blue-700 p-2 py-2.5">
        <p className="m-0 ml-3 text-xl font-light uppercase leading-7 text-gray-0">
          {t("indexesTitle")}
        </p>
        <SharePostMenu
          questionTitle={questionTitle}
          btnClassName="!bg-transparent !text-gray-0 dark:!text-gray-0 mr-2"
        />
      </div>
      <div className="px-4 py-5">
        <h1 className="mb-4 mt-0 text-3xl leading-9 text-gray-800 dark:text-gray-800-dark">
          {postData.title}
        </h1>
        {postData.notebook && (
          <NotebookEditor postData={postData as PostWithNotebook} />
        )}
        <p className="text-3xl capitalize leading-9">
          {t.rich("indexScore", {
            value: Math.round(indexValue),
            bold: (chunks) => <b>{chunks}</b>,
          })}
        </p>

        <IndexQuestionsTable indexQuestions={indexQuestions} />

        <CommentFeed postData={postData} inNotebook />
      </div>
    </main>
  );
};

function calculateIndex(posts: PostWithForecastsAndWeight[]): number {
  const weightSum = posts.reduce((acc, post) => acc + post.weight, 0);
  if (weightSum === 0) {
    return 0;
  }

  const scoreSum = posts.reduce((acc, post) => {
    if (!post.question) {
      return acc;
    }

    const latestAggregation =
      post.question.aggregations.recency_weighted.latest;
    if (!latestAggregation) {
      return acc;
    }

    let postValue = 0;
    switch (post.question.type) {
      case QuestionType.Binary: {
        const cp = latestAggregation.centers?.at(-1);
        if (!cp) {
          break;
        }

        const median = scaleInternalLocation(cp, {
          range_min: 0,
          range_max: 100,
          zero_point: null,
        });

        postValue = 2 * median - 1;
        break;
      }
      case QuestionType.Numeric: {
        const scaling = post.question.scaling;
        const min = scaling.range_min;
        const max = scaling.range_max;
        if (!min || !max) {
          break;
        }

        const cp = latestAggregation.centers?.at(-1);
        if (!cp) {
          break;
        }
        const median = scaleInternalLocation(cp, scaling);

        postValue = (2 * median - max - min) / (max - min);
        break;
      }
    }

    return acc + post.weight * postValue;
  }, 0);

  return scoreSum / weightSum;
}

export default IndexNotebook;

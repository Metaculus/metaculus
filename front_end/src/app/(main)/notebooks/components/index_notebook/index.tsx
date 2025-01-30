import { fromUnixTime, subWeeks } from "date-fns";
import { getTranslations } from "next-intl/server";
import React, { FC } from "react";

import NotebookEditor from "@/app/(main)/notebooks/components/notebook_editor";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_header";
import CommentFeed from "@/components/comment_feed";
import { SharePostMenu } from "@/components/post_actions";
import WeeklyMovement from "@/components/weekly_movement";
import PostsApi from "@/services/posts";
import {
  PostWithForecasts,
  PostWithForecastsAndWeight,
  NotebookPost,
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

  const { index: indexValue, indexWeekAgo } = calculateIndex(indexQuestions);
  const indexWeeklyMovement = Number((indexValue - indexWeekAgo).toFixed(1));

  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-3xl flex-1 flex-col  text-base text-gray-800  dark:text-gray-800-dark">
      <PostStatusBox post={postData} className="mb-4" />
      <div className="w-full bg-gray-0 dark:bg-gray-0-dark">
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
            <NotebookEditor postData={postData as NotebookPost} />
          )}

          <IndexQuestionsTable
            indexQuestions={indexQuestions}
            HeadingSection={
              <div className="flex flex-col items-center border-b border-gray-300 bg-blue-100 px-4 py-4 text-center leading-4 dark:border-gray-300-dark dark:bg-blue-100-dark">
                <p className="m-0 mb-2 text-3xl capitalize leading-9">
                  {t.rich("indexScore", {
                    value: Number(indexValue.toFixed(1)),
                    bold: (chunks) => <b>{chunks}</b>,
                  })}
                </p>
                <WeeklyMovement
                  weeklyMovement={indexWeeklyMovement}
                  message={t("weeklyMovementChange", {
                    value:
                      indexWeeklyMovement === 0
                        ? t("noChange")
                        : Math.abs(indexWeeklyMovement),
                  })}
                  className="text-base"
                  iconClassName="text-base"
                />
              </div>
            }
          />

          <CommentFeed postData={postData} inNotebook />
        </div>
      </div>
    </main>
  );
};

function calculateIndex(posts: PostWithForecastsAndWeight[]): {
  index: number;
  indexWeekAgo: number;
} {
  const weightSum = posts.reduce((acc, post) => acc + post.weight, 0);
  if (weightSum === 0) {
    return { index: 0, indexWeekAgo: 0 };
  }

  const { scoreSum, weeklyScoreSum } = posts.reduce(
    (acc, post) => {
      if (!post.question) {
        return acc;
      }

      const latestAggregation =
        post.question.aggregations.recency_weighted.latest;
      const historyAggregation =
        post.question.aggregations.recency_weighted.history;
      if (!latestAggregation) {
        return acc;
      }

      let postValue = 0;
      let postValueWeekAgo = 0;
      const cp = latestAggregation.centers?.at(-1);
      const latestDate = fromUnixTime(latestAggregation.start_time);
      const weekAgoDate = subWeeks(latestDate, 1);
      const weekAgoCP = historyAggregation.find(
        (el) => fromUnixTime(el.start_time) >= weekAgoDate
      )?.centers?.[0];

      switch (post.question.type) {
        case QuestionType.Binary: {
          if (!cp) {
            break;
          }

          const median = scaleInternalLocation(cp, {
            range_min: 0,
            range_max: 100,
            zero_point: null,
          });
          postValue = 2 * median - 1;

          const medianWeekAgo = scaleInternalLocation(weekAgoCP ?? cp, {
            range_min: 0,
            range_max: 100,
            zero_point: null,
          });
          postValueWeekAgo = 2 * medianWeekAgo - 1;
          break;
        }
        case QuestionType.Numeric: {
          const scaling = post.question.scaling;
          const min = scaling.range_min;
          const max = scaling.range_max;
          if (!min || !max) {
            break;
          }

          if (!cp) {
            break;
          }
          const median = scaleInternalLocation(cp, scaling);
          postValue = (2 * median - max - min) / (max - min);

          const medianWeekAgo = scaleInternalLocation(weekAgoCP ?? cp, scaling);
          postValueWeekAgo = (2 * medianWeekAgo - max - min) / (max - min);
          break;
        }
      }

      return {
        scoreSum: acc.scoreSum + post.weight * postValue,
        weeklyScoreSum: acc.weeklyScoreSum + post.weight * postValueWeekAgo,
      };
    },
    { scoreSum: 0, weeklyScoreSum: 0 }
  );

  return {
    index: scoreSum / weightSum,
    indexWeekAgo: weeklyScoreSum / weightSum,
  };
}

export default IndexNotebook;

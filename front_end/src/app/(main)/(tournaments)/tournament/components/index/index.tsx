import { fromUnixTime, subWeeks } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import WeeklyMovement from "@/components/weekly_movement";
import { ProjectIndexWeights } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { scaleInternalLocation } from "@/utils/charts";

import IndexQuestionsTable from "./index_questions_table";

import "./styles.css";

type Props = {
  indexWeights: ProjectIndexWeights[];
};

const IndexSection: FC<Props> = ({ indexWeights }) => {
  const t = useTranslations();

  const { index: indexValue, indexWeekAgo } = calculateIndex(indexWeights);
  const indexWeeklyMovement = Number((indexValue - indexWeekAgo).toFixed(1));

  return (
    <IndexQuestionsTable
      indexWeights={indexWeights}
      showWeeklyMovement={indexWeeklyMovement !== 0}
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
  );
};

function calculateIndex(posts: ProjectIndexWeights[]): {
  index: number;
  indexWeekAgo: number;
} {
  const weightSum = posts.reduce((acc, post) => acc + post.weight, 0);
  if (weightSum === 0) {
    return { index: 0, indexWeekAgo: 0 };
  }

  const weekAgoDate = subWeeks(Date.now(), 1);

  const { scoreSum, weeklyScoreSum } = posts.reduce(
    (acc, obj) => {
      const question =
        obj.post.question ||
        obj.post.group_of_questions?.questions?.find(
          (q) => obj.question_id === q.id
        );

      if (!question) {
        return acc;
      }

      const latestAggregation = question.aggregations.recency_weighted.latest;
      const historyAggregation = question.aggregations.recency_weighted.history;
      if (!latestAggregation) {
        return acc;
      }

      let postValue = 0;
      let postValueWeekAgo = 0;
      const cp = latestAggregation.centers?.at(-1);
      const weekAgoAggregation = historyAggregation.find(
        (el) =>
          el.end_time &&
          fromUnixTime(el.end_time) >=
            fromUnixTime(weekAgoDate.getTime() / 1000)
      );
      const weekAgoCP = weekAgoAggregation?.centers?.[0] ?? null;

      switch (question.type) {
        case QuestionType.Binary: {
          if (isNil(cp)) {
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
          const cdfPoints = latestAggregation.forecast_values;
          if (!cdfPoints.length) {
            break;
          }
          postValue = cdfPoints.reduce(
            (sum, cdfPoint) => sum + (1 - cdfPoint) / cdfPoints.length,
            0
          );
          const cdfPointsWeekAgo =
            weekAgoAggregation?.forecast_values ?? cdfPoints;
          postValueWeekAgo = cdfPointsWeekAgo.reduce(
            (sum, cdfPoint) => sum + (1 - cdfPoint) / cdfPoints.length,
            0
          );
          break;
        }
      }

      return {
        scoreSum: acc.scoreSum + obj.weight * postValue,
        weeklyScoreSum: acc.weeklyScoreSum + obj.weight * postValueWeekAgo,
      };
    },
    { scoreSum: 0, weeklyScoreSum: 0 }
  );

  return {
    index: scoreSum / weightSum,
    indexWeekAgo: weeklyScoreSum / weightSum,
  };
}

export default IndexSection;

import { fromUnixTime, subWeeks } from "date-fns";
import { isNil, uniq } from "lodash";

import { ProjectIndexWeights } from "@/types/projects";
import { QuestionType } from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

export function calculateIndex(posts: ProjectIndexWeights[]): {
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
  console.log(scoreSum / weightSum);
  return {
    index: scoreSum / weightSum,
    indexWeekAgo: weeklyScoreSum / weightSum,
  };
}

export function calculateIndexTimeline(posts: ProjectIndexWeights[]) {
  const weightSum = posts.reduce((acc, post) => acc + post.weight, 0);
  if (weightSum === 0) {
    return { line: [], timestamps: [] };
  }

  const timestamps: number[] = [];
  posts.forEach((weightObj) => {
    const question =
      weightObj.post.question ||
      weightObj.post.group_of_questions?.questions?.find(
        (q) => weightObj.question_id === q.id
      );
    if (!question) {
      return;
    }
    const historyTimestamps =
      question.aggregations.recency_weighted.history.map((el) => el.start_time);
    timestamps.push(...historyTimestamps);
  });
  const sortedTimestamps = uniq([...timestamps]).sort((a, b) => a - b);

  // calculate index value for each timestamp
  const line = sortedTimestamps.map((timestamp, index) => {
    const indexValue = posts.reduce((acc, obj) => {
      const question =
        obj.post.question ||
        obj.post.group_of_questions?.questions?.find(
          (q) => obj.question_id === q.id
        );

      if (!question) {
        return acc;
      }
      const aggregation =
        index >= sortedTimestamps.length - 1
          ? question.aggregations.recency_weighted.latest
          : question.aggregations.recency_weighted.history.findLast(
              (el) => el.start_time <= timestamp
            );
      if (!aggregation) {
        return acc;
      }
      let postValue = 0;
      const cp = aggregation.centers?.at(-1);

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
          break;
        }
        case QuestionType.Numeric: {
          const cdfPoints = aggregation.forecast_values ?? [];
          if (!cdfPoints.length) {
            break;
          }
          postValue = cdfPoints.reduce(
            (sum, cdfPoint) => sum + (1 - cdfPoint) / cdfPoints.length,
            0
          );
          break;
        }
      }
      return acc + obj.weight * postValue;
    }, 0);

    return {
      y: indexValue / weightSum,
      x: timestamp,
    };
  });
  const lastPoint = line.at(-1);
  if (!isNil(lastPoint?.y)) {
    const now = Date.now() / 1000;
    line.push({
      y: lastPoint.y,
      x: now,
    });
    sortedTimestamps.push(now);
  }
  return { line, timestamps: sortedTimestamps };
}

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
  const sortedTimestamps = uniq([...timestamps]).sort(
    (a, b) => a - b
  ) as number[];
  const firstTimestamp = sortedTimestamps[0];

  if (sortedTimestamps.length === 0 || isNil(firstTimestamp)) {
    return { line: [], timestamps: [] };
  }

  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  const domain = now - firstTimestamp;
  const maxSize = 400;

  let daySize = 0;
  let weekSize = 0;
  let monthSize = 0;
  let allSize = 0;

  if (domain <= day) {
    daySize = maxSize;
  } else if (domain <= day * 7) {
    const evenSpread = Math.floor(maxSize / 2);
    weekSize = Math.floor((evenSpread * (domain - day)) / (day * 6));
    const remainder = evenSpread - weekSize;
    daySize = evenSpread + remainder;
  } else if (domain <= day * 60) {
    const evenSpread = Math.floor(maxSize / 3);
    monthSize = Math.floor((evenSpread * (domain - day * 7)) / (day * 53));
    const remainder = evenSpread - monthSize;
    weekSize = evenSpread + Math.floor(remainder / 2);
    daySize = evenSpread + Math.floor(remainder / 2);
  } else {
    const evenSpread = Math.floor(maxSize / 4);
    allSize = Math.floor((evenSpread * (domain - day * 60)) / (day * 60));
    const remainder = evenSpread - allSize;
    monthSize = evenSpread + Math.floor(remainder / 3);
    weekSize = evenSpread + Math.floor(remainder / 3);
    daySize = evenSpread + Math.floor(remainder / 3);
  }

  const sampleTimeRange = (start: number, end: number, size: number) => {
    const points = sortedTimestamps.filter((t) => t >= start && t < end);
    if (points.length <= size) return points;
    if (points.length === 0) return [];

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    const middlePoints = points.slice(1, -1);
    const step = Math.floor(middlePoints.length / (size - 2));
    const sampledMiddle = middlePoints
      .filter((_, i) => i % step === 0)
      .slice(0, size - 2);

    return [firstPoint, ...sampledMiddle, lastPoint];
  };

  const dayHistory = sampleTimeRange(now - day, now, daySize);
  const weekHistory = sampleTimeRange(now - day * 7, now - day, weekSize);
  const monthHistory = sampleTimeRange(
    now - day * 60,
    now - day * 7,
    monthSize
  );
  const allHistory = sampleTimeRange(firstTimestamp, now - day * 60, allSize);

  const finalTimestamps = [
    ...allHistory,
    ...monthHistory,
    ...weekHistory,
    ...dayHistory,
    now,
  ]
    .filter((t): t is number => t !== undefined)
    .sort((a, b) => a - b);

  const line = finalTimestamps.map((timestamp, index) => {
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
        index >= finalTimestamps.length - 2
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

  return { line, timestamps: finalTimestamps };
}

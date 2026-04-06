import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

import { JOBS_DATA } from "../data";

export type JobWithPost = (typeof JOBS_DATA)[number] & {
  post: PostWithForecasts | null;
};

export const fetchJobsData = cache(
  async (): Promise<{
    jobs: JobWithPost[];
    postsByIdMap: Map<number, PostWithForecasts>;
  }> => {
    const allPostIds = JOBS_DATA.map((job) => job.post_id);
    const { results: posts } = await ServerPostsApi.getPostsWithCP({
      ids: allPostIds,
      limit: allPostIds.length,
    });

    const postsByIdMap = new Map(posts.map((post) => [post.id, post]));

    const jobs = JOBS_DATA.map((job) => ({
      ...job,
      post: postsByIdMap.get(job.post_id) ?? null,
    }));

    return { jobs, postsByIdMap };
  }
);

export type YearValue = { year: number; value: number };

const OVERALL_POST_ID = 41307;

export const fetchOverallData = cache(async (): Promise<YearValue[]> => {
  const post = await ServerPostsApi.getPost(OVERALL_POST_ID, true);
  const questions = post.group_of_questions?.questions as
    | QuestionWithNumericForecasts[]
    | undefined;

  const points =
    questions
      ?.map((q) => {
        const year = Number(q.label);
        if (isNaN(year)) return null;
        const value = getSubQuestionValue(q);
        if (value == null) return null;
        return { year, value };
      })
      .filter((d): d is YearValue => d !== null)
      .sort((a, b) => a.year - b.year) ?? [];

  if (points.length && points[0]?.year !== 2025) {
    points.unshift({ year: 2025, value: 0 });
  }

  return points;
});

export function getSubQuestionValue(
  question: QuestionWithNumericForecasts
): number | null {
  const center =
    question.aggregations[question.default_aggregation_method]?.latest
      ?.centers?.[0];
  if (center == null) return null;
  return scaleInternalLocation(center, question.scaling);
}

/**
 * Builds a table from jobs data where each row is:
 * [job name, value for subQ column 0, value for subQ column 1, ...]
 *
 * Sub-questions are grouped by label and sorted alphabetically so that
 * the same-titled sub-question always occupies the same column position
 * across all jobs.
 */
export async function fetchJobsTableData(options?: {
  labels?: string[];
}): Promise<{
  columns: string[];
  rows: (string | number | null)[][];
  postIds: number[];
}> {
  const { jobs } = await fetchJobsData();

  // Collect all unique sub-question labels across every post
  const labelsSet = new Set<string>();
  for (const job of jobs) {
    const questions = job.post?.group_of_questions?.questions;
    if (!questions) continue;
    for (const q of questions) {
      if (q.label) labelsSet.add(q.label);
    }
  }

  let columns = Array.from(labelsSet).sort();
  if (options?.labels?.length) {
    const allowed = new Set(options.labels);
    columns = columns.filter((col) => allowed.has(col));
  }

  const rows = jobs.map((job) => {
    const questions = job.post?.group_of_questions
      ?.questions as QuestionWithNumericForecasts[];
    const questionByLabel = new Map(questions?.map((q) => [q.label, q]) ?? []);

    const values: (number | null)[] = columns.map((label) => {
      const q = questionByLabel.get(label);
      if (!q) return null;
      return getSubQuestionValue(q);
    });

    return [job.name, ...values];
  });

  const postIds = jobs.map((job) => job.post_id);
  return { columns, rows, postIds };
}

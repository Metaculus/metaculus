import "server-only";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

import { getSubQuestionValue } from "./fetch_jobs_data";

const HOURS_WORKED_POST_ID = 41574;
const YOUTH_UNEMPLOYMENT_POST_ID = 42212;
const TRADE_SCHOOL_GROWTH_POST_ID = 42856;

const KEY_INSIGHTS_POST_IDS = [
  HOURS_WORKED_POST_ID,
  YOUTH_UNEMPLOYMENT_POST_ID,
  TRADE_SCHOOL_GROWTH_POST_ID,
];

export type KeyInsightsData = {
  hoursWorked2035: number | null;
  youthUnemployment2035: number | null;
  tradeSchoolGrowth2035: number | null;
};

function getValueForYear(
  post: PostWithForecasts | undefined,
  year: string
): number | null {
  const questions = post?.group_of_questions?.questions as
    | QuestionWithNumericForecasts[]
    | undefined;
  const question = questions?.find((q) => q.label === year);
  if (!question) return null;
  return getSubQuestionValue(question);
}

export const fetchKeyInsightsData = cache(
  async (): Promise<KeyInsightsData> => {
    const { results: posts } = await ServerPostsApi.getPostsWithCP({
      ids: KEY_INSIGHTS_POST_IDS,
      limit: KEY_INSIGHTS_POST_IDS.length,
    });

    const postsById = new Map(posts.map((post) => [post.id, post]));

    return {
      hoursWorked2035: getValueForYear(
        postsById.get(HOURS_WORKED_POST_ID),
        "2035"
      ),
      youthUnemployment2035: getValueForYear(
        postsById.get(YOUTH_UNEMPLOYMENT_POST_ID),
        "2035"
      ),
      tradeSchoolGrowth2035: getValueForYear(
        postsById.get(TRADE_SCHOOL_GROWTH_POST_ID),
        "2034-35"
      ),
    };
  }
);

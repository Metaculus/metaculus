import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { scaleInternalLocation } from "@/utils/math";

function getValueForLabel(
  questions: QuestionWithNumericForecasts[] | undefined,
  label: string
): number | null {
  const q = questions?.find((q) => q.label === label);
  if (!q) return null;
  const center =
    q.aggregations[q.default_aggregation_method]?.latest?.centers?.[0];
  if (center == null) return null;
  return scaleInternalLocation(center, q.scaling);
}

/**
 * Per-occupation median-wage forecast for 2035 (real change vs 2025).
 * Returns null when the job has no wage question or the data is unavailable.
 */
export const fetchWage = cache(
  async (wagePostId: number | undefined): Promise<number | null> => {
    if (!wagePostId) return null;
    try {
      const post = await ServerPostsApi.getPost(wagePostId, true);
      const questions = post.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined;
      return getValueForLabel(questions, "2035");
    } catch (err) {
      logError(err);
      return null;
    }
  }
);

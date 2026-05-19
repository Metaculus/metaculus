import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { scaleInternalLocation } from "@/utils/math";

import { HOURS_WORKED_POST_ID } from "../../data";

export type WageHoursValues = {
  wage2035: number | null;
  hours2035: number | null;
  hours2025: number | null;
};

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

export const fetchWageAndHours = cache(
  async (wagePostId: number | undefined): Promise<WageHoursValues> => {
    const result: WageHoursValues = {
      wage2035: null,
      hours2035: null,
      hours2025: null,
    };

    if (wagePostId) {
      try {
        const post = await ServerPostsApi.getPost(wagePostId, true);
        const questions = post.group_of_questions?.questions as
          | QuestionWithNumericForecasts[]
          | undefined;
        result.wage2035 = getValueForLabel(questions, "2035");
      } catch (err) {
        logError(err);
      }
    }

    try {
      const hoursPost = await ServerPostsApi.getPost(
        HOURS_WORKED_POST_ID,
        true
      );
      const questions = hoursPost.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined;
      result.hours2035 = getValueForLabel(questions, "2035");
      result.hours2025 = getValueForLabel(questions, "2025");
    } catch (err) {
      logError(err);
    }

    return result;
  }
);

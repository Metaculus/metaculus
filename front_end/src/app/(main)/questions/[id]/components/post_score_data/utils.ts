import { isNil } from "lodash";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

export function shouldShowScores(post: PostWithForecasts): boolean {
  if (isGroupOfQuestionsPost(post)) {
    return post.group_of_questions.questions.some((q) => {
      const cpScores =
        q.aggregations?.[q.default_aggregation_method]?.score_data;
      return !isNil(cpScores) && Object.keys(cpScores).length > 0;
    });
  }

  return post.status === PostStatus.RESOLVED;
}

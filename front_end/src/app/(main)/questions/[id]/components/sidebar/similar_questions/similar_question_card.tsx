import { differenceInMilliseconds } from "date-fns";
import Link from "next/link";
import { FC } from "react";

import PostStatusIndicator from "@/components/post_status";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import SimilarPredictionChip from "./similar_question_prediction_chip";
import { useHideCP } from "../../cp_provider";

type Props = {
  post: PostWithForecasts;
};

const SimilarQuestionCard: FC<Props> = ({ post }) => {
  const resolutionData = extractPostResolution(post);
  const { hideCP } = useHideCP();
  return (
    <Link href={getPostLink(post)} className="w-full no-underline">
      <div className="gap-2 rounded border border-blue-500 px-4 py-3 dark:border-blue-600">
        <div className="flex flex-col gap-1.5">
          <h4 className="my-0 text-gray-800 dark:text-gray-800-dark">
            {post.title}
          </h4>

          {!hideCP && (
            <div className="flex flex-row gap-2">
              {!!post.question && (
                <SimilarPredictionChip
                  question={post.question as QuestionWithNumericForecasts}
                />
              )}
              {!!post.group_of_questions && (
                <SimilarPredictionChip
                  isGroup
                  question={getPredictionQuestion(
                    post.group_of_questions
                      .questions as QuestionWithNumericForecasts[],
                    post.curation_status
                  )}
                />
              )}
            </div>
          )}
          <div>
            <PostStatusIndicator post={post} resolution={resolutionData} />
          </div>
        </div>
      </div>
    </Link>
  );
};

function getPredictionQuestion(
  questions: QuestionWithNumericForecasts[],
  curationStatus: PostStatus
) {
  const sortedQuestions = questions
    .map((q) => ({
      ...q,
      resolvedAt: new Date(q.scheduled_resolve_time),
      fanName: q.label,
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt));

  if (curationStatus === PostStatus.RESOLVED) {
    return sortedQuestions[sortedQuestions.length - 1] ?? null;
  }

  return (
    sortedQuestions.find((q) => q.resolution === null) ??
    sortedQuestions[sortedQuestions.length - 1] ??
    null
  );
}

export default SimilarQuestionCard;

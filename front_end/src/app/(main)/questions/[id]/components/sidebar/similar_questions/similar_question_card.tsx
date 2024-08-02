import Link from "next/link";
import { FC } from "react";

import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPostResolution,
  getPredictionQuestion,
} from "@/utils/questions";

import SimilarPredictionChip from "./similar_question_prediction_chip";

type Props = {
  post: PostWithForecasts;
};

const SimilarQuestionCard: FC<Props> = ({ post }) => {
  const resolutionData = extractPostResolution(post);

  return (
    <Link href={`/questions/${post.id}`} className="w-full no-underline">
      <div className="gap-2 rounded border border-blue-500 px-4 py-3 dark:border-blue-600">
        <div className="flex flex-col gap-1.5">
          <h4 className="my-0 text-gray-800 dark:text-gray-800-dark">
            {post.title}
          </h4>

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
          <div>
            <PostStatus post={post} resolution={resolutionData} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SimilarQuestionCard;

import Link from "next/link";
import { FC } from "react";

import BinaryCompactForecastText from "@/app/(main)/questions/components/binary_compact_forecast_text";
import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import SimilarPredictionChip from "./similar_question_prediction_chip";

type Props = {
  post: PostWithForecasts;
};

const SimilarQuestionCard: FC<Props> = ({ post }) => {
  const isGroup =
    isGroupOfQuestionsPost(post) ||
    post.question?.type === QuestionType.MultipleChoice;

  const isBinary =
    isQuestionPost(post) && post.question?.type === QuestionType.Binary;

  return (
    <Link href={getPostLink(post)} className="w-full no-underline">
      <div className="gap-2 rounded-sm border border-blue-400 px-5 py-4 dark:border-blue-400-dark">
        <div className="flex flex-col gap-2.5">
          <div
            className={cn("flex flex-row items-start gap-3", {
              "flex-col": isGroup,
            })}
          >
            <h4 className="my-0 flex-1 font-medium leading-6 text-gray-800 dark:text-gray-800-dark">
              {post.title}
            </h4>

            {!isBinary && <SimilarPredictionChip post={post} />}
          </div>

          {isBinary ? (
            <div className="flex items-center gap-3">
              <BinaryCompactForecastText
                question={post.question as QuestionWithNumericForecasts}
              />
              <ForecastersCounter
                forecasters={post.nr_forecasters}
                compact
                className="px-0"
              />
            </div>
          ) : (
            <ForecastersCounter
              forecasters={post.nr_forecasters}
              className="mt-0.5 px-0"
            />
          )}
        </div>
      </div>
    </Link>
  );
};

export default SimilarQuestionCard;

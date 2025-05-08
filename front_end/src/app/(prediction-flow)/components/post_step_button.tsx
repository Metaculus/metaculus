import { isNil } from "lodash";
import { FC } from "react";

import Button from "@/components/ui/button";
import { PredictionFlowPost } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  post: PredictionFlowPost;
  className?: string;
};

const PostStepButton: FC<Props> = ({ post, className }) => {
  const isPredicted = isPostOpenQuestionPredicted(post);
  const { currentPostId, flowType, changeActivePost } = usePredictionFlow();
  const isActiveStep = currentPostId === post.id;
  const isCompletedStep = isNil(flowType) ? isPredicted : post.isDone;
  return (
    <Button
      variant="primary"
      className={cn(
        "h-3 max-h-3 w-full rounded-none border-2 border-transparent bg-gray-300 p-0 hover:border-transparent hover:bg-gray-400 dark:border-transparent dark:bg-gray-300-dark dark:hover:border-transparent dark:hover:bg-gray-400-dark",
        {
          "border-blue-600 bg-blue-200 hover:border-blue-600 hover:bg-gray-300 dark:border-blue-600-dark dark:bg-blue-200-dark dark:hover:border-blue-600-dark dark:hover:bg-gray-300-dark":
            isActiveStep,
          "bg-olive-500 hover:bg-olive-600 dark:bg-olive-500-dark dark:hover:bg-olive-600-dark":
            isCompletedStep,
          "border-olive-800 dark:border-olive-800-dark":
            isCompletedStep && isActiveStep,
        },
        className
      )}
      onClick={() => {
        changeActivePost(post.id);
      }}
    />
  );
};

export default PostStepButton;

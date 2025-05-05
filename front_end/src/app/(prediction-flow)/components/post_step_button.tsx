import { FC } from "react";

import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostPredicted } from "@/utils/forecasts/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const PostStepButton: FC<Props> = ({ post, className }) => {
  const isPredicted = isPostPredicted(post);
  const { currentPostId, setCurrentPostId } = usePredictionFlow();
  const isActiveStep = currentPostId === post.id;
  console.log(currentPostId, post.id, isActiveStep);
  console.log(isPredicted);
  return (
    <Button
      variant="primary"
      className={cn(
        "h-3 max-h-3 w-full rounded-none border-2 border-transparent bg-gray-300 p-0 dark:bg-gray-300-dark",
        {
          "border-blue-600 bg-blue-200 dark:border-blue-600-dark dark:bg-blue-200-dark":
            isActiveStep,
          "bg-olive-500 dark:bg-olive-500-dark": isPredicted,
        },
        className
      )}
      onClick={() => setCurrentPostId(post.id)}
    />
  );
};

export default PostStepButton;

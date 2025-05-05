import { isNil } from "lodash";
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
  const { posts, setPosts, currentPostId, setCurrentPostId, flowType } =
    usePredictionFlow();
  const isActiveStep = currentPostId === post.id;

  return (
    <Button
      variant="primary"
      className={cn(
        "h-3 max-h-3 w-full rounded-none border-2 border-transparent bg-gray-300 p-0 hover:border-transparent hover:bg-gray-400 dark:border-transparent dark:bg-gray-300-dark dark:hover:border-transparent dark:hover:bg-gray-400-dark",
        {
          "bg-olive-500 hover:bg-olive-600 dark:bg-olive-500-dark dark:hover:bg-olive-600-dark":
            isPredicted,
          "dark:hover-bg-gray-300-dark border-blue-600 bg-blue-200 hover:bg-gray-300 dark:border-blue-600-dark dark:bg-blue-200-dark":
            isActiveStep,
        },
        className
      )}
      onClick={() => {
        if (isNil(flowType)) {
          setPosts(
            posts.map((p) => {
              if (p.id === currentPostId) {
                return { ...p, isDone: true };
              }
              return p;
            })
          );
        }
        setCurrentPostId(post.id);
      }}
    />
  );
};

export default PostStepButton;

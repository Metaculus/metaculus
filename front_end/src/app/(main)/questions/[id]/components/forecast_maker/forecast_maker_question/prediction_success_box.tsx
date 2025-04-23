"use client";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

interface PredictionSuccessBoxProps {
  forecastValue: number | string;
  onCommentClick?: () => void;
  className?: string;
  post: PostWithForecasts;
}

const PredictionSuccessBox: FC<PredictionSuccessBoxProps> = ({
  forecastValue,
  onCommentClick,
  className,
  post,
}) => {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "mt-4 flex flex-col items-center justify-center gap-3 border border-gray-500 bg-gray-100 p-4 text-center dark:border-gray-500-dark dark:bg-gray-100-dark",
        className
      )}
    >
      <h4 className="m-0">
        {t("youPredicted")}{" "}
        <span className="text-orange-800 dark:text-orange-800-dark">
          <span className="whitespace-nowrap font-bold text-orange-800 dark:text-orange-800-dark">
            {forecastValue}
          </span>
        </span>
      </h4>
      <div className="mx-1 flex flex-wrap items-center justify-center gap-2">
        <PostSubscribeButton post={post} />

        <Button variant="secondary" onClick={onCommentClick}>
          <FontAwesomeIcon
            icon={faComment}
            className="text-yellow-600 dark:text-yellow-400"
          />
          {t("shareInComment")}
        </Button>
      </div>
    </div>
  );
};

export default PredictionSuccessBox;

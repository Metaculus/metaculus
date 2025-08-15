"use client";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PredictionSuccessLinks } from "@/components/forecast_maker/forecast_maker_question/prediction_success_links";
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
      <h4 className="m-0 text-balance">
        {t("youPredicted")}{" "}
        <span className="whitespace-normal break-words font-bold text-orange-800 dark:text-orange-800-dark">
          {forecastValue}
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

      <PredictionSuccessLinks post={post}></PredictionSuccessLinks>
    </div>
  );
};

export default PredictionSuccessBox;

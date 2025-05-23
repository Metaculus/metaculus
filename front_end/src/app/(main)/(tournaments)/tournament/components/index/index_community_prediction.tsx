import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import QuestionCPMovement from "@/components/cp_movement";
import { PostWithForecasts } from "@/types/post";

const CP_MOVEMENT_DISPLAY_THRESHOLD = 7 * 24 * 60 * 60; // one week in seconds

export type IndexCommunityPrediction = {
  rawValue: number | null;
  displayValue: string;
};

type Props = {
  post: PostWithForecasts;
  checkDelta: boolean;
} & IndexCommunityPrediction;

const CommunityPrediction: FC<Props> = ({
  rawValue,
  displayValue,
  post,
  checkDelta,
}) => {
  const t = useTranslations();
  const movementPeriod = +(
    post.question?.aggregations?.recency_weighted?.movement?.period || 0
  );

  if (isNil(rawValue)) {
    return (
      <span className="text-gray-500 dark:text-gray-500-dark">
        {t("notAvailable")}
      </span>
    );
  }

  return (
    <div className="flex flex-row items-center gap-1 md:flex-col md:gap-0.5">
      <span className="font-bold text-gray-700 dark:text-gray-700-dark">
        {displayValue}
      </span>
      {/* Ensure we render only Weekly movement questions */}
      {!!post.question && movementPeriod >= CP_MOVEMENT_DISPLAY_THRESHOLD && (
        <QuestionCPMovement
          question={post.question}
          threshold={checkDelta ? 0.01 : 0}
        />
      )}
    </div>
  );
};

export default CommunityPrediction;

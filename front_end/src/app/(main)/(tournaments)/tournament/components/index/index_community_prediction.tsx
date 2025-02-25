import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import CPWeeklyMovement from "@/components/cp_weekly_movement";
import { PostWithForecasts } from "@/types/post";

export type IndexCommunityPrediction = {
  rawValue: number | null;
  displayValue: string;
};

type Props = {
  post: PostWithForecasts;
} & IndexCommunityPrediction;

const CommunityPrediction: FC<Props> = ({ rawValue, displayValue, post }) => {
  const t = useTranslations();

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
      {!!post.question && <CPWeeklyMovement question={post.question} />}
    </div>
  );
};

export default CommunityPrediction;

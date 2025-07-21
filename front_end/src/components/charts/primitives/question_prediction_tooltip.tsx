import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import { QuestionStatus } from "@/types/post";
import cn from "@/utils/core/cn";

type Props = {
  communityPrediction: ReactNode;
  userPrediction?: ReactNode;
  totalForecasters: number;
  isConsumerView?: boolean;
  questionStatus?: QuestionStatus;
};

const QuestionPredictionTooltip: FC<Props> = ({
  communityPrediction,
  userPrediction,
  totalForecasters,
  isConsumerView = false,
  questionStatus,
}) => {
  const t = useTranslations();

  if (isConsumerView) {
    return (
      <span
        className={cn(
          "flex h-full w-max rounded-sm bg-olive-700 px-1 py-0.5 text-xs font-medium leading-3 text-gray-0 dark:bg-olive-700-dark dark:text-gray-0-dark",
          {
            "bg-gray-700 dark:bg-gray-700-dark":
              questionStatus === QuestionStatus.CLOSED,
            "bg-purple-800 dark:bg-purple-800-dark":
              questionStatus === QuestionStatus.RESOLVED,
          }
        )}
      >
        {communityPrediction ? communityPrediction : "?"}
      </span>
    );
  }

  return (
    <div className="w-max rounded border border-gray-300 py-2 dark:border-gray-300-dark">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-8 px-3">
          <span className="font-medium capitalize text-olive-700 dark:text-olive-700-dark">
            {t("community")}
          </span>
          <span>{communityPrediction ? communityPrediction : "?"}</span>
        </div>

        {userPrediction && (
          <div className="flex items-center justify-between gap-8 px-3">
            <span className="font-medium capitalize text-orange-700 dark:text-orange-700-dark">
              {t("myPrediction")}
            </span>
            <span>{userPrediction}</span>
          </div>
        )}
        <hr className="border-gray-200 dark:border-gray-200-dark" />
        <div className="flex items-center justify-between gap-8 px-3">
          <span className="font-medium">{t("totalForecastersLabel")}</span>
          <span>{totalForecasters}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPredictionTooltip;

import { useTranslations } from "next-intl";
import React, { FC } from "react";

type Props = {
  totalQuestions: string;
  averageScore: string;
};

const TrackRecordChartHero: FC<Props> = ({ totalQuestions, averageScore }) => {
  const t = useTranslations();

  return (
    <div className="text-center text-sm text-gray-600 dark:text-gray-600-dark">
      {t("totalQuestions")}
      <span className="mr-3.5 font-bold text-purple-800 dark:text-purple-800-dark">
        {" " + totalQuestions}
      </span>
      {t("averageScore")}
      <span className="mr-3.5 font-bold text-purple-800 dark:text-purple-800-dark">
        {" " + averageScore}
      </span>
    </div>
  );
};

export default TrackRecordChartHero;

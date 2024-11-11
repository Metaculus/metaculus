import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import SidebarTooltip from "../sidebar_tooltip";

type Props = { questionWeight: number | undefined };

const QuestionWeightInfo: FC<Props> = ({ questionWeight }) => {
  const t = useTranslations();

  if (isNil(questionWeight) || questionWeight === 1.0) {
    return null;
  }

  return (
    <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
      <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
        {t("questionWeight")}:
      </span>
      <span className="leading-4">
        <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
          {Math.round(questionWeight * 100)}%
        </span>
        <SidebarTooltip
          tooltipContent={t.rich("questionWeightTooltip", {
            count: questionWeight - 1 < 0 ? 1 : 2,
            weight: Math.round(questionWeight * 100),
            weightDiff: Math.round(Math.abs(1 - questionWeight) * 100),
            bold: (chunks) => <span className="font-bold">{chunks}</span>,
          })}
        />
      </span>
    </div>
  );
};

export default QuestionWeightInfo;

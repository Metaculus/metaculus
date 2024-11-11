import { useTranslations } from "next-intl";
import { FC } from "react";

import SidebarTooltip from "../sidebar_tooltip";

type Props = { questionWeight: number };

const QuestionWeightInfo: FC<Props> = ({ questionWeight }) => {
  const t = useTranslations();
  return (
    <SidebarTooltip
      tooltipContent={t.rich("questionWeightTooltip", {
        count: questionWeight - 1 < 0 ? 1 : 2,
        weight: Math.round(questionWeight * 100),
        weightDiff: Math.round(Math.abs(1 - questionWeight) * 100),
        bold: (chunks) => <span className="font-bold">{chunks}</span>,
      })}
    />
  );
};

export default QuestionWeightInfo;

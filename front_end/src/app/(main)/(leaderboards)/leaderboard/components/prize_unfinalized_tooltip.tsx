import { useTranslations } from "next-intl";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";

const UnfinalizedPrizeTooltip: FC = () => {
  const t = useTranslations();
  return (
    <div className="inline-flex items-center justify-end">
      <span className="mr-1">{t("prize")}</span>
      <div className="relative w-4 text-blue-700 dark:text-blue-700-dark">
        <Tooltip
          showDelayMs={200}
          placement={"right"}
          tooltipContent={t("unfinalizedPrizeTooltip")}
          className="absolute left-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center font-sans text-base leading-none"
          variant="light"
          tooltipClassName="font-sans text-center"
        >
          <span className="leading-none">ⓘ</span>
        </Tooltip>
      </div>
    </div>
  );
};

export default UnfinalizedPrizeTooltip;

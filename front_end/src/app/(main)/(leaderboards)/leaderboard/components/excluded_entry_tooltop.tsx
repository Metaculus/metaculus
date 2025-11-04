import { useTranslations } from "next-intl";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";

const ExcludedEntryTooltip: FC = () => {
  const t = useTranslations();
  return (
    <div className="justify-left flex flex-1 items-center">
      <div className="relative text-blue-700 dark:text-blue-700-dark">
        <Tooltip
          showDelayMs={200}
          placement={"right"}
          tooltipContent={t("entryExcluded")}
          className="absolute right-[-18px] top-[0.5px] inline-flex h-full items-center justify-center font-sans"
          tooltipClassName="font-sans text-center text-gray-800 dark:text-gray-800-dark border-blue-400 dark:border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark"
        >
          <span className="leading-none">ⓘ</span>
        </Tooltip>
      </div>
    </div>
  );
};

export default ExcludedEntryTooltip;

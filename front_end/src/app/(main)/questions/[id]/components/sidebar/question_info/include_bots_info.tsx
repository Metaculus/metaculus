import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import SidebarTooltip from "../sidebar_tooltip";

type Props = {
  includeBotsInAggregate: boolean | undefined;
};

const IncludeBotsInfo: FC<Props> = ({ includeBotsInAggregate }) => {
  const t = useTranslations();

  if (!includeBotsInAggregate) {
    return null;
  }

  return (
    <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
      <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
        {t("includeBots")}:
      </span>
      <span className="leading-4">
        <span className="text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
          {t("Yes")}
        </span>

        <SidebarTooltip
          tooltipContent={t.rich("includeBotsTooltip", {
            link: (chunks) => (
              <Link
                href={"/aib"}
                className="inline-block text-sm font-medium leading-5 text-blue-700 dark:text-blue-700-dark"
              >
                {chunks}
              </Link>
            ),
          })}
        />
      </span>
    </div>
  );
};

export default IncludeBotsInfo;

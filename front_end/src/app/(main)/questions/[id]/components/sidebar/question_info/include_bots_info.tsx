import Link from "next/link";
import { useTranslations } from "next-intl";

import SidebarTooltip from "../sidebar_tooltip";

const IncludeBotsInfo = () => {
  const t = useTranslations();
  return (
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
  );
};

export default IncludeBotsInfo;

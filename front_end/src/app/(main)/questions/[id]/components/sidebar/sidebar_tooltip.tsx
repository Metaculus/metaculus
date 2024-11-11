import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import Tooltip from "@/components/ui/tooltip";

type Props = {
  tooltipContent: ReactNode | string;
};
const SidebarTooltip: FC<Props> = ({ tooltipContent }) => {
  const t = useTranslations();
  return (
    <Tooltip
      showDelayMs={200}
      placement={"bottom"}
      tooltipContent={tooltipContent}
      className="ml-1 h-4"
      tooltipClassName="text-center !max-w-[331px] !border-blue-400 dark:!border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark !text-base !p-4"
    >
      <FontAwesomeIcon
        icon={faCircleQuestion}
        height={16}
        className="text-gray-500 hover:text-blue-800 dark:text-gray-500-dark dark:hover:text-blue-800-dark"
      />
    </Tooltip>
  );
};

export default SidebarTooltip;

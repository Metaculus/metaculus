import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, ReactNode } from "react";

import Tooltip from "@/components/ui/tooltip";

type Props = {
  tooltipContent: ReactNode | string;
};
const SidebarTooltip: FC<Props> = ({ tooltipContent }) => {
  return (
    <Tooltip
      showDelayMs={200}
      placement={"bottom"}
      tooltipContent={tooltipContent}
      className="ml-1 h-4"
      variant="light"
      tooltipClassName="text-center !max-w-[331px] !text-base !p-4"
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

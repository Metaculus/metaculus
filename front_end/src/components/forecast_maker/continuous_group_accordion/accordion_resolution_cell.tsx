import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { FC } from "react";

import ResolutionIcon from "@/components/icons/resolution";
import Tooltip from "@/components/ui/tooltip";
import { QuestionStatus, Resolution } from "@/types/post";
import cn from "@/utils/core/cn";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  formatedResolution: string;
  median: string | undefined;
  userMedian: string | undefined;
  resolution: Resolution | null;
  type: QuestionStatus.OPEN | QuestionStatus.CLOSED | QuestionStatus.RESOLVED;
  unit?: string;
  withdrawnLabel?: string;
};

const AccordionResolutionCell: FC<Props> = ({
  formatedResolution,
  median,
  userMedian,
  resolution,
  type,
  withdrawnLabel,
}) => {
  const isResolved = !isNil(resolution);
  if (isResolved) {
    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-1">
        <ResolutionIcon
          className={cn("text-purple-700 dark:text-purple-700-dark", {
            "sm:hidden": !isUnsuccessfullyResolved(resolution),
          })}
        />
        <span
          className="text-sm font-bold text-purple-700 dark:text-purple-700-dark"
          suppressHydrationWarning
        >
          {formatedResolution}
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-0.5 sm:w-[105px]">
      <p
        className={cn(
          "m-0 whitespace-nowrap text-sm leading-4 text-olive-800 dark:text-olive-800-dark",
          {
            "text-gray-700 dark:text-gray-700-dark":
              type === QuestionStatus.CLOSED,
          }
        )}
      >
        {median}
      </p>
      {!!userMedian && (
        <div className="m-0 flex items-center gap-1 leading-4">
          {withdrawnLabel ? (
            <Tooltip
              tooltipContent={withdrawnLabel}
              showDelayMs={120}
              placement="right-start"
              tooltipClassName="z-[999] sm:ml-0 ml-[68px] -mt-4 sm:mt-0 rounded-sm px-1.5 py-0.5 text-[10px] leading-tight border-0 bg-salmon-800 dark:text-gray-0-dark text-gray-0 shadow-none dark:bg-salmon-800-dark"
            >
              <div className="inline-flex items-center gap-1 whitespace-nowrap">
                <span className="text-sm font-normal text-orange-700 dark:text-orange-700-dark">
                  {userMedian}
                </span>
                <FontAwesomeIcon
                  className="text-salmon-800 dark:text-salmon-800-dark"
                  size="xs"
                  icon={faTriangleExclamation}
                />
              </div>
            </Tooltip>
          ) : (
            <p className="m-0 whitespace-nowrap text-sm text-orange-700 dark:text-orange-700-dark">
              {userMedian}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export { AccordionResolutionCell };

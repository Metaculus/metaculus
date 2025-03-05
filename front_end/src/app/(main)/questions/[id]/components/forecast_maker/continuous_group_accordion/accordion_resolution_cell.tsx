import { isNil } from "lodash";
import { FC } from "react";

import ResolutionIcon from "@/components/icons/resolution";
import { QuestionStatus, Resolution } from "@/types/post";
import cn from "@/utils/cn";
import { isUnsuccessfullyResolved } from "@/utils/questions";

type Props = {
  formatedResolution: string;
  median: string | undefined;
  userMedian: string | undefined;
  resolution: Resolution | null;
  type: QuestionStatus.OPEN | QuestionStatus.CLOSED | QuestionStatus.RESOLVED;
};

const AccordionResolutionCell: FC<Props> = ({
  formatedResolution,
  median,
  userMedian,
  resolution,
  type,
}) => {
  const isResolved = !isNil(resolution);
  if (isResolved) {
    return (
      <div className="wrap flex w-full items-center justify-center gap-1">
        <ResolutionIcon
          className={cn({
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
          "m-0 text-sm leading-4 text-olive-800 dark:text-olive-800-dark",
          {
            "text-gray-700 dark:text-gray-700-dark":
              type === QuestionStatus.CLOSED,
          }
        )}
      >
        {median}
      </p>
      {!!userMedian && (
        <p className="m-0 text-sm leading-4 text-orange-700 dark:text-orange-700-dark">
          {userMedian}
        </p>
      )}
    </div>
  );
};

export { AccordionResolutionCell };

import { FC } from "react";

import ResolutionIcon from "@/components/icons/resolution";

type Props = {
  formatedResolution: string;
  isResolved: boolean;
  median: string | undefined;
  userMedian: string | undefined;
};

const AccordionResolutionCell: FC<Props> = ({
  formatedResolution,
  isResolved,
  median,
  userMedian,
}) => {
  if (isResolved) {
    return (
      <div className="flex w-full items-center justify-center gap-1">
        <ResolutionIcon />
        <span
          className="text-sm font-bold text-purple-800 dark:text-purple-800-dark"
          suppressHydrationWarning
        >
          {formatedResolution}
        </span>
      </div>
    );
  }
  return (
    <div className="flex w-full flex-col items-center justify-center gap-1">
      <p className="m-0 text-sm leading-4 text-olive-800 dark:text-olive-800-dark">
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

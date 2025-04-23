import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  weeklyMovement: number;
  message: string;
  className?: string;
  iconClassName?: string;
};

const WeeklyMovement: FC<Props> = ({
  weeklyMovement,
  message,
  className,
  iconClassName,
}) => {
  const isNegative = weeklyMovement < 0;
  const noChange = weeklyMovement === 0;
  return (
    <div className={cn("flex gap-1", className)}>
      <span
        className={cn(
          "font-medium leading-4",
          isNegative
            ? "text-salmon-600 dark:text-salmon-600-dark"
            : "text-olive-700 dark:text-olive-700-dark",
          noChange && "text-gray-500 dark:text-gray-500-dark"
        )}
      >
        {!noChange && (
          <FontAwesomeIcon
            className={cn(
              isNegative
                ? "text-salmon-600 dark:text-salmon-600-dark"
                : "text-olive-700 dark:text-olive-700-dark",
              "mr-1",
              iconClassName
            )}
            icon={isNegative ? faArrowDown : faArrowUp}
          />
        )}
        {message}
      </span>
    </div>
  );
};

export default WeeklyMovement;

import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, ReactNode } from "react";

import { MovementDirection } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  direction: MovementDirection;
  message: string | ReactNode;
  className?: string;
  iconClassName?: string;
};

const MovementIcon = ({
  direction,
  iconClassName,
}: {
  direction: MovementDirection;
  iconClassName?: string;
}) => {
  switch (direction) {
    case MovementDirection.UP:
      return (
        <FontAwesomeIcon
          className={cn(
            "mr-1 text-olive-700 dark:text-olive-700-dark",
            iconClassName
          )}
          icon={faArrowUp}
        />
      );
    case MovementDirection.DOWN:
      return (
        <FontAwesomeIcon
          className={cn(
            "mr-1 text-salmon-600 dark:text-salmon-600-dark",
            iconClassName
          )}
          icon={faArrowDown}
        />
      );
    case MovementDirection.EXPANDED:
      return <span className="mr-1 align-text-bottom text-[10px]">←→</span>;
    case MovementDirection.CONTRACTED:
      return <span className="mr-1 align-text-bottom text-[10px]">→←</span>;
  }
};

const PeriodMovement: FC<Props> = ({
  direction,
  message,
  className,
  iconClassName,
}) => {
  const noChange = !direction || direction == MovementDirection.UNCHANGED;
  return (
    <div className={cn("flex gap-1", className)}>
      <span
        className={cn("font-medium leading-4", {
          "text-salmon-600 dark:text-salmon-600-dark":
            direction === MovementDirection.DOWN,
          "text-olive-700 dark:text-olive-700-dark":
            direction == MovementDirection.UP,
          "text-gray-500 dark:text-gray-500-dark": ![
            MovementDirection.UP,
            MovementDirection.DOWN,
          ].includes(direction),
        })}
      >
        {!noChange && (
          <MovementIcon iconClassName={iconClassName} direction={direction} />
        )}
        {message}
      </span>
    </div>
  );
};

export default PeriodMovement;

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
  size?: "xs" | "sm";
  chip?: string | ReactNode;
};

const MovementIcon = ({
  direction,
  iconClassName,
  size,
}: {
  direction: MovementDirection;
  iconClassName?: string;
  size?: "xs" | "sm";
}) => {
  switch (direction) {
    case MovementDirection.UP:
      return (
        <FontAwesomeIcon
          className={cn(
            "mr-1 text-inherit text-olive-700 dark:text-olive-700-dark",
            iconClassName
          )}
          icon={faArrowUp}
        />
      );
    case MovementDirection.DOWN:
      return (
        <FontAwesomeIcon
          className={cn(
            "mr-1 text-inherit text-salmon-600 dark:text-salmon-600-dark",
            iconClassName
          )}
          icon={faArrowDown}
        />
      );
    case MovementDirection.EXPANDED:
      return (
        <span
          className={cn("mr-1 align-text-bottom", {
            "text-[8px]": size === "xs",
            "text-[10px]": size === "sm",
          })}
        >
          ←→
        </span>
      );
    case MovementDirection.CONTRACTED:
      return (
        <span
          className={cn("mr-1 align-text-bottom", {
            "text-[8px]": size === "xs",
            "text-[10px]": size === "sm",
          })}
        >
          →←
        </span>
      );
  }
};

const PeriodMovement: FC<Props> = ({
  direction,
  message,
  className,
  iconClassName,
  size = "sm",
  chip,
}) => {
  const noChange = !direction || direction == MovementDirection.UNCHANGED;
  return (
    <div className={cn("flex gap-1", className)}>
      <span
        className={cn("font-normal leading-4", {
          "text-salmon-700 dark:text-salmon-700-dark":
            direction === MovementDirection.DOWN,
          "text-olive-700 dark:text-olive-700-dark":
            direction == MovementDirection.UP,
          "text-gray-700 dark:text-gray-700-dark": ![
            MovementDirection.UP,
            MovementDirection.DOWN,
          ].includes(direction),
          "text-xs": size === "xs",
          "text-sm": size === "sm",
        })}
      >
        {!!chip ? (
          <span
            className={cn("rounded-xs px-1.5 py-0.5", {
              "bg-salmon-200 dark:bg-salmon-200-dark":
                direction === MovementDirection.DOWN,
              "bg-olive-300 dark:bg-olive-300-dark":
                direction === MovementDirection.UP,
              "bg-gray-200 dark:bg-gray-200-dark": ![
                MovementDirection.UP,
                MovementDirection.DOWN,
              ].includes(direction),
            })}
          >
            {!noChange && (
              <MovementIcon
                iconClassName={iconClassName}
                direction={direction}
                size={size}
              />
            )}
            {chip}
          </span>
        ) : (
          !noChange && (
            <MovementIcon
              iconClassName={iconClassName}
              direction={direction}
              size={size}
            />
          )
        )}
        {message}
      </span>
    </div>
  );
};

export default PeriodMovement;

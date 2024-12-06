import { faCaretUp, faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

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

  return (
    <div className={classNames("flex gap-1", className)}>
      <span
        className={classNames(
          "font-medium leading-4",
          isNegative
            ? "text-salmon-600 dark:text-salmon-600-dark"
            : "text-olive-700 dark:text-olive-700-dark"
        )}
      >
        <FontAwesomeIcon
          className={classNames(
            isNegative
              ? "text-salmon-600 dark:text-salmon-600-dark"
              : "text-olive-700 dark:text-olive-700-dark",
            iconClassName
          )}
          icon={isNegative ? faCaretDown : faCaretUp}
        />{" "}
        {message}
      </span>
    </div>
  );
};

export default WeeklyMovement;
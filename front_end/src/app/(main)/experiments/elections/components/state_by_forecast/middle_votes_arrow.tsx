import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

type Props = {
  className?: string;
};

const MiddleVotesArrow: FC<Props> = ({ className }) => {
  return (
    <div
      className={classNames(
        "flex flex-col items-center gap-1 text-sm",
        className
      )}
    >
      <span className="hidden font-sans text-gray-800 dark:text-gray-800-dark sm:block">
        270 votes to win
      </span>
      <span className="block font-sans text-gray-800 dark:text-gray-800-dark sm:hidden">
        270 to win
      </span>
      <FontAwesomeIcon
        className="text-blue-500 dark:text-blue-500"
        icon={faChevronDown}
      />
    </div>
  );
};

export default MiddleVotesArrow;

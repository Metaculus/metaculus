import classNames from "classnames";
import { FC } from "react";

type Props = {
  className?: string;
};

const CircleDivider: FC<Props> = ({ className }) => {
  return (
    <span
      className={classNames("text-gray-400 dark:text-gray-400-dark", className)}
    >
      •
    </span>
  );
};

export default CircleDivider;

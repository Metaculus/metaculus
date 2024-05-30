import classNames from "classnames";
import { FC } from "react";

type Props = {
  color: {
    DEFAULT: string;
    dark: string;
  };
  className?: string;
};

const ChoiceIcon: FC<Props> = ({ color, className }) => {
  return (
    <div
      className={classNames("size-4 rounded-sm", className)}
      style={{ background: color.DEFAULT }}
    />
  );
};

export default ChoiceIcon;

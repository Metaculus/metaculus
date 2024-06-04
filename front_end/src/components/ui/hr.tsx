import classNames from "classnames";
import { FC, HTMLAttributes } from "react";

const Hr: FC<HTMLAttributes<HTMLHRElement>> = ({ className, ...props }) => {
  return (
    <hr className={classNames("border-neutral-400", className)} {...props} />
  );
};

export default Hr;

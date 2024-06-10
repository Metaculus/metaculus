import classNames from "classnames";
import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

type Props = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  active: boolean;
  className?: string;
};

const SliderThumb: FC<Props> = ({ active, className, ...props }) => (
  <div
    {...props}
    className={classNames(active ? "size-5" : "size-5 rounded-full", className)}
  />
);

export default SliderThumb;

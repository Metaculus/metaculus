import classNames from "classnames";
import { FC, HTMLProps, RefCallback } from "react";

interface HTMLPropsWithRefCallback<T> extends HTMLProps<T> {
  ref: RefCallback<T>;
}

type Props = {
  active: boolean;
  className?: string;
  sliderProps: HTMLPropsWithRefCallback<HTMLDivElement>;
};

const SliderThumb: FC<Props> = ({ sliderProps, active, className }) => (
  <div
    {...sliderProps}
    className={classNames(
      "cursor-pointer border border-gray-900 bg-blue-100 focus:outline-none dark:border-gray-900-dark dark:bg-blue-100-dark",
      active ? "size-5" : "size-5 rounded-full",
      className
    )}
  />
);

export default SliderThumb;

import classNames from "classnames";
import { CSSProperties, FC, HTMLProps, RefCallback } from "react";

interface HTMLPropsWithRefCallback<T> extends HTMLProps<T> {
  ref: RefCallback<T>;
}

type Props = {
  sliderProps: HTMLPropsWithRefCallback<HTMLDivElement>;
  className?: string;
};

const SliderTrack: FC<Props> = ({ sliderProps, className }) => (
  <div
    {...sliderProps}
    className={classNames(
      "border border-gray-900 dark:border-gray-900",
      className
    )}
  />
);

export default SliderTrack;

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

type Props = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  active: boolean;
  onClickIn?: () => void;
  onArrowClickIn?: () => void;
  onArrowClickOut?: (direction: -1 | 1) => void;
  className?: string;
  arrowClassName?: string;
};

const SliderThumb: FC<Props> = ({
  active,
  className,
  onClickIn,
  onArrowClickIn,
  onArrowClickOut,
  arrowClassName,
  ...props
}) => (
  <div
    {...props}
    className={classNames(
      "absolute flex cursor-pointer items-center focus:outline-none",
      className
    )}
  >
    {!!onArrowClickIn && !!onArrowClickOut && (
      <ArrowButton
        direction="left"
        onClickIn={onArrowClickIn}
        onClickOut={() => onArrowClickOut(-1)}
        className={arrowClassName}
      />
    )}
    <div
      onMouseDown={onClickIn}
      onTouchStart={onClickIn}
      className={classNames(
        "border border-gray-900 bg-blue-100 dark:border-gray-900-dark dark:bg-blue-100-dark",
        active ? "size-5" : "size-4 rounded-full"
      )}
    />
    {!!onArrowClickIn && !!onArrowClickOut && (
      <ArrowButton
        direction="right"
        onClickIn={onArrowClickIn}
        onClickOut={() => onArrowClickOut(1)}
        className={arrowClassName}
      />
    )}
  </div>
);

type ArrowButtonProps = {
  direction: "left" | "right";
  onClickIn: () => void;
  onClickOut: () => void;
  className?: string;
};
const ArrowButton: FC<ArrowButtonProps> = ({
  direction,
  onClickIn,
  onClickOut,
  className,
}) => (
  <button
    className={classNames(
      "invisible flex h-5 items-center bg-blue-200 px-1.5 text-gray-300 hover:text-gray-600 active:text-gray-900 group-hover:visible dark:bg-blue-200-dark dark:text-gray-300-dark dark:hover:text-gray-600-dark dark:active:text-gray-900-dark",
      className
    )}
    onMouseDown={onClickIn}
    onMouseUp={onClickOut}
    onTouchStart={onClickIn}
    onTouchEnd={onClickOut}
  >
    <FontAwesomeIcon
      icon={direction === "right" ? faChevronRight : faChevronLeft}
      size="lg"
    />
  </button>
);

export default SliderThumb;

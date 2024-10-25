import {
  faChevronLeft,
  faChevronRight,
  faPlus,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { DetailedHTMLProps, FC, HTMLAttributes } from "react";

type Props = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> & {
  active: boolean;
  value: number;
  showValue?: boolean;
  onClickIn?: () => void;
  onArrowClickIn?: () => void;
  onArrowClickOut?: (direction: -1 | 1) => void;
  className?: string;
  arrowClassName?: string;
};

const SliderThumb: FC<Props> = ({
  active,
  value,
  showValue = false,
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
      onMouseDown={(e) => {
        e.preventDefault();
        onClickIn?.();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        onClickIn?.();
      }}
      className={classNames(
        "flex items-center border border-gray-900 bg-blue-100 text-center dark:border-gray-900-dark dark:bg-blue-100-dark",
        active ? "size-5 text-center" : "size-4",
        { "h-8 w-14 rounded-full": showValue }
      )}
    >
      {showValue && (
        <span className="mx-auto text-center text-sm">{value}%</span>
      )}{" "}
      {/* Add this line */}
    </div>
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
      "invisible flex items-center rounded-full bg-blue-200 px-1.5 py-1 text-center text-gray-500 hover:text-gray-700 active:text-blue-800 group-hover:visible dark:bg-blue-800 dark:hover:text-gray-300 dark:active:text-blue-200",
      className
    )}
    onMouseDown={(e) => {
      e.stopPropagation();
      onClickIn();
    }}
    onMouseUp={onClickOut}
    onTouchStart={(e) => {
      e.stopPropagation();
      onClickIn();
    }}
    onTouchEnd={onClickOut}
  >
    <FontAwesomeIcon
      icon={direction === "right" ? faPlus : faMinus}
      size="lg"
    />
  </button>
);

export default SliderThumb;

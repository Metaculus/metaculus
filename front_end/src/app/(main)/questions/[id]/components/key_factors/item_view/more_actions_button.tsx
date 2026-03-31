import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { forwardRef } from "react";

import cn from "@/utils/core/cn";

type Props = {
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
};

const MoreActionsButton = forwardRef<HTMLButtonElement, Props>(
  ({ isActive, onClick, onPointerDown }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="menu"
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-xs",
        isActive
          ? "bg-blue-500 text-gray-0 dark:bg-blue-500-dark dark:text-gray-0-dark"
          : "text-gray-500 hover:bg-gray-300 dark:text-gray-500-dark dark:hover:bg-gray-300-dark"
      )}
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <FontAwesomeIcon icon={faEllipsis} />
    </button>
  )
);

MoreActionsButton.displayName = "MoreActionsButton";

export default MoreActionsButton;

import {
  faArrowLeft,
  faXmark,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  showDeleteButton?: boolean;
  onDeleteButtonClick?: () => void;
  onBack?: () => void;
  icon?: IconDefinition;
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
  headerClassName?: string;
  withHeader?: boolean;
  color?: "blue" | "purple";
}>;

const KeyFactorsNewItemContainer: React.FC<Props> = ({
  onDeleteButtonClick,
  onBack,
  icon,
  label,
  children,
  showDeleteButton = false,
  containerClassName,
  labelClassName,
  headerClassName,
  withHeader = true,
  color = "blue",
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded border border-blue-500 bg-blue-100 px-5 py-4 dark:border-blue-500-dark dark:bg-blue-100-dark",
        color === "purple" &&
          "min-h-[120px] bg-purple-100 dark:bg-purple-100-dark",
        containerClassName
      )}
    >
      {withHeader && (
        <div className="flex justify-between">
          <div
            className={cn(
              "flex items-center gap-2 text-xs text-blue-700 opacity-50 dark:text-blue-700-dark",
              headerClassName
            )}
          >
            {!onBack && icon ? (
              <FontAwesomeIcon icon={icon} />
            ) : (
              <FontAwesomeIcon
                className="cursor-pointer"
                onClick={onBack}
                icon={faArrowLeft}
              />
            )}
            <span className={cn("uppercase", labelClassName)}>{label}</span>
          </div>
          {showDeleteButton && (
            <Button variant="link" onClick={onDeleteButtonClick}>
              <FontAwesomeIcon
                icon={faXmark}
                className="size-4 text-salmon-600 dark:text-salmon-600-dark"
              />
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default KeyFactorsNewItemContainer;

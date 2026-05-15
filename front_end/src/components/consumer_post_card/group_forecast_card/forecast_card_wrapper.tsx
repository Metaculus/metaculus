import {
  faChevronDown,
  faChevronUp,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  otherItemsCount: number;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  compact?: boolean;
  buttonVariant?: "primary" | "minimal";
  className?: string;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  expanded = false,
  onExpand,
  onCollapse,
  compact = false,
  buttonVariant = "primary",
  className,
  children,
}) => {
  const t = useTranslations();
  const showExpandRow = !expanded && otherItemsCount > 0;

  const isMinimal = buttonVariant === "minimal";

  const toggleButtonClassName = cn(
    "flex w-full self-stretch items-center gap-2 rounded-lg px-[13px]",
    "font-medium leading-4",
    compact ? "h-6 md:h-8" : "h-8",
    isMinimal
      ? "border border-gray-300 text-xs text-gray-700 sm:text-sm dark:border-gray-300-dark dark:text-gray-700-dark"
      : "bg-blue-500/20 text-sm text-blue-700 dark:bg-blue-500-dark/20 dark:text-blue-700-dark"
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        compact ? "gap-1 md:gap-2" : "gap-2",
        className
      )}
    >
      {children}

      {showExpandRow &&
        (isMinimal ? (
          <div className={toggleButtonClassName}>
            <FontAwesomeIcon
              icon={faEllipsis}
              className="h-3 w-3 opacity-[0.45] sm:h-4 sm:w-4"
            />
            {t("otherWithCount", { count: otherItemsCount })}
          </div>
        ) : (
          <button
            type="button"
            onClick={onExpand}
            aria-pressed={false}
            className={toggleButtonClassName}
          >
            <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
            {t("otherWithCount", { count: otherItemsCount })}
          </button>
        ))}

      {expanded && onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-pressed={true}
          className={toggleButtonClassName}
        >
          <FontAwesomeIcon
            icon={isMinimal ? faEllipsis : faChevronUp}
            className={cn(
              isMinimal ? "h-3 w-3 opacity-[0.45] sm:h-4 sm:w-4" : "h-4 w-4"
            )}
          />
          {t("collapse")}
        </button>
      )}
    </div>
  );
};

export default ForecastCardWrapper;

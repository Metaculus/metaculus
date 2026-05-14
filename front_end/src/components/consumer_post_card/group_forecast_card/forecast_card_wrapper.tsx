import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  otherItemsCount: number;
  othersTotal?: number;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  hideOthersValue?: boolean;
  compact?: boolean;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  expanded = false,
  onExpand,
  onCollapse,
  compact = false,
  children,
}) => {
  const t = useTranslations();
  const showExpandRow = !expanded && otherItemsCount > 0;

  const toggleButtonClassName = cn(
    "flex w-full self-stretch items-center gap-2 rounded-lg px-[13px]",
    "bg-blue-500/20 dark:bg-blue-500-dark/20",
    "text-sm font-medium leading-4 text-blue-700 dark:text-blue-700-dark",
    compact ? "h-6 md:h-8" : "h-8"
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        compact ? "gap-1 md:gap-2" : "gap-2"
      )}
    >
      {children}

      {showExpandRow && (
        <button
          type="button"
          onClick={onExpand}
          aria-pressed={false}
          className={toggleButtonClassName}
        >
          <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
          {t("otherWithCount", { count: otherItemsCount })}
        </button>
      )}

      {expanded && onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-pressed={true}
          className={toggleButtonClassName}
        >
          <FontAwesomeIcon icon={faChevronUp} className="h-4 w-4" />
          {t("collapse")}
        </button>
      )}
    </div>
  );
};

export default ForecastCardWrapper;

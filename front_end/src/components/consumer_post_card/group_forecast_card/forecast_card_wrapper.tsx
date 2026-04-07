import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  otherItemsCount: number;
  othersTotal?: number;
  expanded?: boolean;
  onExpand?: () => void;
  hideOthersValue?: boolean;
  compact?: boolean;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  othersTotal = 0,
  expanded = false,
  onExpand,
  hideOthersValue = false,
  compact = false,
  children,
}) => {
  const t = useTranslations();
  const showRow = !expanded && otherItemsCount > 0;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        compact ? "gap-1 md:gap-2" : "gap-2"
      )}
    >
      {children}

      {showRow && (
        <button
          type="button"
          onClick={onExpand}
          aria-pressed={false}
          className={cn(
            "group relative flex w-full items-center justify-between gap-3 rounded-[8px]",
            compact
              ? "h-6 px-2 py-0.5 md:h-8 md:px-[10px] md:py-1"
              : "h-8 px-[10px] py-1",
            "border border-blue-400 bg-white",
            "dark:border-blue-400-dark dark:bg-transparent"
          )}
        >
          <span
            className={cn(
              "absolute -inset-[1px] inline-flex items-center text-nowrap rounded-[8px] px-3 py-1 text-gray-700 dark:text-gray-700-dark",
              compact && "text-xs md:text-base",
              "border border-gray-500 dark:border-gray-500-dark",
              "group-hover:border-gray-600 group-hover:dark:border-gray-600-dark",
              "bg-gray-100 transition-colors dark:bg-gray-100-dark",
              "group-hover:bg-gray-200 dark:group-hover:bg-gray-200-dark",
              "group-active:bg-gray-300 dark:group-active:bg-gray-300-dark",
              "group-hover:text-gray-800 dark:group-hover:text-gray-800-dark"
            )}
            style={{
              width: (() => {
                const hasPct =
                  typeof othersTotal === "number" && !Number.isNaN(othersTotal);
                const pct = hasPct
                  ? Math.min(100, Math.max(0, othersTotal))
                  : Math.min(100, Math.max(0, otherItemsCount));
                return `calc(${pct}% + 2px)`;
              })(),
            }}
          >
            {t("otherWithCount", { count: otherItemsCount })}
          </span>

          {!hideOthersValue && (
            <span
              className={cn(
                "ml-auto font-semibold text-gray-900 dark:text-gray-900-dark",
                compact && "text-xs font-normal md:text-base md:font-semibold"
              )}
            >
              {Math.round(othersTotal)}%
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default ForecastCardWrapper;

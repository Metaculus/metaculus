import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

type Props = {
  otherItemsCount: number;
  othersTotal?: number;
  expanded?: boolean;
  onExpand?: () => void;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  othersTotal = 0,
  expanded = false,
  onExpand,
  children,
}) => {
  const t = useTranslations();
  const showRow = !expanded && otherItemsCount > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      {children}

      {showRow && (
        <button
          type="button"
          onClick={onExpand}
          aria-pressed={false}
          className={cn(
            "group relative flex w-full items-center justify-between gap-3 rounded-[8px] px-[10px] py-1",
            "border border-blue-400 bg-white",
            "dark:border-blue-400-dark dark:bg-transparent"
          )}
        >
          <span
            className={cn(
              "absolute -inset-[1px] inline-flex items-center text-nowrap rounded-[8px] px-3 py-1 text-gray-700 dark:text-gray-700-dark",
              "border border-gray-500 dark:border-gray-500-dark",
              "group-hover:border-gray-600 group-hover:dark:border-gray-600-dark",
              "bg-gray-100 transition-colors dark:bg-gray-100-dark",
              "group-hover:bg-gray-200 dark:group-hover:bg-gray-200-dark",
              "group-active:bg-gray-300 dark:group-active:bg-gray-300-dark",
              "group-hover:text-gray-800 dark:group-hover:text-gray-800-dark"
            )}
            style={{
              width: `calc(${otherItemsCount}% + 2px)`,
            }}
          >
            {t("otherWithCount", { count: otherItemsCount })}
          </span>

          <span className="ml-auto font-semibold text-gray-900 dark:text-gray-900-dark">
            {Math.round(othersTotal)}%
          </span>
        </button>
      )}
    </div>
  );
};

export default ForecastCardWrapper;

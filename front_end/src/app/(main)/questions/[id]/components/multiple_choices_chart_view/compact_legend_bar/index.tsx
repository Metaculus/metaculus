"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getForecastPctDisplayValue } from "@/utils/formatters/prediction";

const MOBILE_MAX_ITEMS = 5;

type Props = {
  items: ChoiceItem[];
  questionType: QuestionType.MultipleChoice | QuestionType.Binary;
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
};

function isResolvedNo(item: ChoiceItem, questionType: QuestionType): boolean {
  if (questionType === QuestionType.Binary) return item.resolution === "no";
  return item.displayedResolution === "No";
}

function getLastAggregationValue(item: ChoiceItem): number | null {
  const values = item.aggregationValues;
  for (let i = values.length - 1; i >= 0; i--) {
    const v = values[i];
    if (v != null) return v;
  }
  return null;
}

const CompactLegendBar: FC<Props> = ({
  items,
  questionType,
  onChoiceChange,
  onChoiceHighlight,
}) => {
  const t = useTranslations();
  const isMd = useBreakpoint("md");
  const [showAll, setShowAll] = useState(false);

  const resolvedNoCount = items.filter((item) =>
    isResolvedNo(item, questionType)
  ).length;
  const normalItems = items.filter((item) => !isResolvedNo(item, questionType));

  let visibleItems: ChoiceItem[];
  let hiddenCount: number;

  if (showAll) {
    visibleItems = items;
    hiddenCount = 0;
  } else if (!isMd) {
    // Mobile: show up to MOBILE_MAX_ITEMS normal items only; resolved-NO always hidden
    const mobileVisible = normalItems.slice(0, MOBILE_MAX_ITEMS);
    visibleItems = mobileVisible;
    hiddenCount = items.length - mobileVisible.length;
  } else {
    // Desktop: show all normal items; resolved-NO hidden
    visibleItems = normalItems;
    hiddenCount = resolvedNoCount;
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {visibleItems.map((item) => {
        const resolvedNo = isResolvedNo(item, questionType);
        const pct = getForecastPctDisplayValue(getLastAggregationValue(item));

        return (
          <div
            key={item.choice}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5",
              resolvedNo
                ? "cursor-default"
                : "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-200-dark",
              item.highlighted && "bg-gray-200 dark:bg-gray-200-dark"
            )}
            onMouseEnter={() =>
              !resolvedNo && onChoiceHighlight(item.choice, true)
            }
            onMouseLeave={() =>
              !resolvedNo && onChoiceHighlight(item.choice, false)
            }
          >
            {resolvedNo ? (
              <>
                <span className="size-3 shrink-0 rounded-full bg-gray-300 dark:bg-gray-300-dark" />
                <span className="max-w-[120px] truncate text-sm font-medium leading-4 text-gray-400 line-through dark:text-gray-400-dark md:text-base md:leading-5">
                  {item.label || item.choice}
                </span>
              </>
            ) : (
              <>
                <span
                  role="checkbox"
                  aria-label={item.label || item.choice}
                  aria-checked={item.active}
                  tabIndex={0}
                  className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border border-gray-500 dark:border-gray-500-dark"
                  style={
                    item.active
                      ? {
                          backgroundColor: item.color.DEFAULT,
                          borderColor: "transparent",
                        }
                      : undefined
                  }
                  onClick={() => onChoiceChange(item.choice, !item.active)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onChoiceChange(item.choice, !item.active);
                    }
                  }}
                >
                  {item.active && (
                    <svg
                      viewBox="0 0 10 8"
                      className="h-2.5 w-3 fill-none stroke-white stroke-2"
                    >
                      <path
                        d="M1 4l3 3 5-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="max-w-[120px] truncate text-sm font-medium leading-4 text-gray-800 dark:text-gray-800-dark md:text-base md:leading-5">
                  {item.label || item.choice}
                </span>
                <span className="shrink-0 text-sm tabular-nums leading-4 text-gray-600 dark:text-gray-600-dark md:text-base md:leading-6">
                  {pct}
                </span>
              </>
            )}
          </div>
        );
      })}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="overflow-hidden text-ellipsis text-sm font-medium leading-4 text-gray-500 underline decoration-gray-400 dark:text-gray-500-dark dark:decoration-gray-400-dark md:text-base md:leading-5"
        >
          {t("nMore", { count: hiddenCount })}
        </button>
      )}
    </div>
  );
};

export default CompactLegendBar;

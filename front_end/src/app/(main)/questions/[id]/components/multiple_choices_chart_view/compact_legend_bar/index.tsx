import { FC } from "react";

import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getForecastPctDisplayValue } from "@/utils/formatters/prediction";

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
  return (
    <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
      {items.map((item) => {
        const resolvedNo = isResolvedNo(item, questionType);
        const pct = getForecastPctDisplayValue(getLastAggregationValue(item));

        return (
          <div
            key={item.choice}
            className={cn(
              "flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5",
              "hover:bg-gray-200 dark:hover:bg-gray-200-dark",
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
                <span className="size-2.5 shrink-0 rounded-full bg-gray-400 dark:bg-gray-400-dark" />
                <span className="max-w-[120px] truncate text-gray-500 line-through dark:text-gray-500-dark">
                  {item.label || item.choice}
                </span>
              </>
            ) : (
              <>
                <span
                  role="checkbox"
                  aria-checked={item.active}
                  tabIndex={0}
                  className="flex size-3.5 shrink-0 cursor-pointer items-center justify-center rounded-[2px] border"
                  style={
                    item.active
                      ? {
                          backgroundColor: item.color.DEFAULT,
                          borderColor: "transparent",
                        }
                      : {
                          borderColor: item.color.DEFAULT,
                          backgroundColor: "transparent",
                        }
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
                      className="h-2 w-2.5 fill-none stroke-white stroke-2"
                    >
                      <path
                        d="M1 4l3 3 5-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="max-w-[120px] truncate text-gray-800 dark:text-gray-800-dark">
                  {item.label || item.choice}
                </span>
                <span className="shrink-0 tabular-nums text-gray-600 dark:text-gray-600-dark">
                  {pct}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CompactLegendBar;

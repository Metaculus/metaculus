import React, { FC, ReactNode } from "react";

import cn from "@/utils/cn";
import { formatValueUnit } from "@/utils/questions";

type Variant = "default" | "prediction" | "my-prediction";

type CursorPredictionDrawerProps = {
  centerDisplay?: string;
  lowerDisplay?: string;
  upperDisplay?: string;
  unit?: string;
};

export const CursorPredictionDrawer: FC<CursorPredictionDrawerProps> = ({
  centerDisplay,
  lowerDisplay,
  upperDisplay,
  unit,
}) => {
  if (centerDisplay == null) {
    return "...";
  }

  if (lowerDisplay != null && upperDisplay !== null) {
    return (
      <div className="text-center">
        <div className="font-bold">{formatValueUnit(centerDisplay, unit)}</div>
        <div className="text-xs font-normal">
          ({lowerDisplay} - {upperDisplay})
        </div>
      </div>
    );
  }

  return centerDisplay;
};

type CursorDetailItemProps = {
  title: string;
  content: ReactNode;
  variant?: Variant;
};

const CursorDetailItem: FC<CursorDetailItemProps> = ({
  title,
  content,
  variant = "default",
}) => {
  return (
    <div className="flex flex-col items-center whitespace-normal">
      <span className="text-xs">{title}</span>
      <span
        className={cn(
          "font-bold",
          {
            "text-olive-700 dark:text-olive-700-dark": variant === "prediction",
          },
          {
            "text-orange-800 dark:text-orange-800-dark":
              variant === "my-prediction",
          }
        )}
      >
        {content}
      </span>
    </div>
  );
};

export default CursorDetailItem;

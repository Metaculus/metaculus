"use client";

import React from "react";

import Tooltip from "@/components/ui/tooltip";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

type Props = {
  models: string[];
};

/**
 * Coming soon banner component for displaying upcoming models
 */
const FutureEvalComingSoonBanner: React.FC<Props> = ({ models }) => {
  const formatModelList = () => {
    if (models.length === 0) return null;
    if (models.length === 1) {
      return (
        <span className="whitespace-nowrap text-futureeval-bg-dark dark:text-futureeval-bg-light">
          {models[0]}
        </span>
      );
    }

    return models.map((model, index) => {
      const isLast = index === models.length - 1;
      const isSecondToLast = index === models.length - 2;

      return (
        <React.Fragment key={model}>
          <span className="whitespace-nowrap text-futureeval-bg-dark dark:text-futureeval-bg-light">
            {model}
          </span>
          {isSecondToLast && " and "}
          {!isLast && !isSecondToLast && ", "}
        </React.Fragment>
      );
    });
  };

  if (models.length === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-4 py-2",
        "w-full sm:w-auto sm:max-w-xs",
        "bg-futureeval-primary-light/15 dark:bg-futureeval-primary-dark/15"
      )}
    >
      <span
        className={cn(
          FE_TYPOGRAPHY.bodySmall,
          FE_COLORS.textSubheading,
          "text-left sm:text-center"
        )}
      >
        {formatModelList()}{" "}
        <Tooltip
          tooltipContent="Since we measure against real world events, it takes time for new models to populate the leaderboard."
          tooltipClassName="!bg-futureeval-bg-dark/90 dark:!bg-futureeval-bg-light/90 !text-futureeval-bg-light/80 dark:!text-futureeval-bg-dark/80 !border-0"
          placement="top"
        >
          <button
            type="button"
            className={cn(
              "cursor-help border-0 bg-transparent p-0 underline",
              FE_COLORS.textAccent
            )}
          >
            coming soon
          </button>
          .
        </Tooltip>
      </span>
    </div>
  );
};

export default FutureEvalComingSoonBanner;

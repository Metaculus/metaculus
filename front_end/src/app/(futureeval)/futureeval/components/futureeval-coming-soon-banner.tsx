"use client";

import React from "react";

import Tooltip from "@/components/ui/tooltip";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

/**
 * Coming soon banner component for displaying upcoming models
 */
const FutureEvalComingSoonBanner: React.FC = () => {
  return (
    <div className={cn("inline-flex items-center gap-1")}>
      <span className={cn(FE_TYPOGRAPHY.bodySmall, FE_COLORS.textSubheading)}>
        <span className="text-futureeval-bg-dark dark:text-futureeval-bg-light">
          Deepseek V3
        </span>
        ,{" "}
        <span className="text-futureeval-bg-dark dark:text-futureeval-bg-light">
          Claude 4.3 Sonnet
        </span>{" "}
        and{" "}
        <span className="text-futureeval-bg-dark dark:text-futureeval-bg-light">
          Grok 3.5
        </span>{" "}
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
        </Tooltip>
      </span>
    </div>
  );
};

export default FutureEvalComingSoonBanner;

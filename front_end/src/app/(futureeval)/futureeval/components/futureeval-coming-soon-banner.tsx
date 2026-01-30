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
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1",
        "bg-futureeval-primary-light/10 dark:bg-futureeval-primary-dark/10"
      )}
    >
      <span className={cn(FE_TYPOGRAPHY.bodySmall, FE_COLORS.textSubheading)}>
        <span className={FE_COLORS.textAccent}>Deepseek V3</span>,{" "}
        <span className={FE_COLORS.textAccent}>Claude 4.3 Sonnet</span> and{" "}
        <span className={FE_COLORS.textAccent}>Grok 3.5</span>{" "}
        <Tooltip
          tooltipContent="Since we measure against real world events, it takes time for new models to populate the leaderboard."
          tooltipClassName="!bg-futureeval-bg-dark/90 dark:!bg-futureeval-bg-light/90 !text-futureeval-bg-light/80 dark:!text-futureeval-bg-dark/80 !border-0"
          placement="top"
        >
          <span className="cursor-help underline">coming soon</span>
        </Tooltip>
      </span>
    </div>
  );
};

export default FutureEvalComingSoonBanner;

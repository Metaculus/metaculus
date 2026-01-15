"use client";

import Link from "next/link";
import React from "react";

import cn from "@/utils/core/cn";

import FutureEvalHeader, { TabItem } from "./futureeval-header";
import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

type Props = {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
};

const FutureEvalHeroBanner: React.FC<Props> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  const showHero = activeTab === "benchmark";

  return (
    <div className={cn("w-full select-none pt-header", FE_COLORS.bgPrimary)}>
      <div
        className={cn(
          "mx-auto box-content max-w-[1044px] px-4 pt-0 sm:px-10 md:px-16 md:pt-8 lg:pt-16",
          showHero ? "pb-4 sm:pb-10 lg:pb-12" : "pb-8 sm:pb-10 lg:pb-12"
        )}
      >
        {/* Header with logo and tabs */}
        <FutureEvalHeader
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {/* Hero content - only on Benchmark tab */}
        {showHero && (
          <div className="mt-8 flex flex-col gap-8 sm:mt-10 lg:mt-32 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            {/* Text content */}
            <div className="flex-1">
              <h1
                className={cn(
                  "m-0 max-w-xl",
                  FE_TYPOGRAPHY.h1,
                  FE_COLORS.textHeading
                )}
              >
                Measuring the forecasting accuracy of AI
              </h1>
              <p
                className={cn(
                  "m-0 mt-4 max-w-xl sm:mt-6",
                  FE_TYPOGRAPHY.body,
                  FE_COLORS.textSubheading
                )}
              >
                FutureEval measures AI&apos;s ability to predict future
                outcomes, which is essential in many real-world tasks. Models
                that score high in our benchmark will be better at planning,
                risk assessment, and decision-making.
              </p>
              <Link
                href="/futureeval/methodology"
                className={cn(
                  "mt-4 inline-block sm:mt-6",
                  FE_TYPOGRAPHY.link,
                  FE_COLORS.textAccent
                )}
              >
                Learn more
              </Link>
            </div>

            {/* Hero placeholder - circular on desktop, rectangular on mobile */}
            <div className="flex items-center justify-center lg:flex-shrink-0">
              <div
                className={cn(
                  // Mobile: rectangular placeholder
                  "flex h-[200px] w-full items-center justify-center rounded-2xl border-2 border-dashed",
                  // Desktop: circular placeholder
                  "sm:h-[280px] lg:h-[320px] lg:w-[320px] lg:rounded-full",
                  FE_COLORS.borderSubtle,
                  FE_COLORS.textMuted
                )}
              >
                <span className={cn(FE_TYPOGRAPHY.bodySmall, "opacity-50")}>
                  Hero Visualization
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureEvalHeroBanner;

"use client";

import Link from "next/link";
import React from "react";

import cn from "@/utils/core/cn";

import FutureEvalHeader, { TabItem } from "./futureeval-header";
import FutureEvalOrbit from "./orbit";
import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

type Props = {
  tabs: TabItem[];
  activeTab: string;
};

const FutureEvalHeroBanner: React.FC<Props> = ({ tabs, activeTab }) => {
  const showHero = activeTab === "benchmark";

  return (
    <div className={cn("w-full pt-header", FE_COLORS.bgPrimary)}>
      <div
        className={cn(
          "mx-auto box-content max-w-[1044px] px-4 pt-4 sm:px-10 md:px-16 md:pt-8 lg:pt-16",
          showHero ? "pb-4 sm:pb-10 lg:pb-12" : "pb-8 sm:pb-10 lg:pb-12"
        )}
      >
        {/* Header with logo and tabs */}
        <FutureEvalHeader tabs={tabs} activeTab={activeTab} />

        {/* Hero content - only on Benchmark tab */}
        {showHero && (
          <div
            className={cn(
              "mt-8 flex flex-col gap-8",
              // Stack vertically below sm, side-by-side above
              "sm:mt-10 sm:flex-row sm:items-center sm:gap-12"
            )}
          >
            {/* Text content - 50% on tablet+ */}
            <div className="flex-1 sm:basis-1/2">
              <h1
                className={cn("m-0", FE_TYPOGRAPHY.h1, FE_COLORS.textHeading)}
              >
                Measuring the forecasting accuracy of AI
              </h1>
              <p
                className={cn(
                  "m-0 mt-4 sm:mt-6",
                  FE_TYPOGRAPHY.body,
                  FE_COLORS.textSubheading
                )}
              >
                FutureEval measures the ability of AI agents to predict future
                outcomes, in Science, Technology, Health, Geopolitics, AI
                itself, and more. Forecasting is a key skill in many real-world
                tasks, enabling planning, risk assessment, and decision-making.
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

            {/* Orbit visualization - 50% on tablet+, centered below on mobile */}
            <div className="flex flex-1 items-center justify-center pb-4 sm:basis-1/2 sm:pb-0">
              <FutureEvalOrbit />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureEvalHeroBanner;

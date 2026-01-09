"use client";

import React from "react";

import cn from "@/utils/core/cn";

import FutureEvalHeader, { TabItem } from "./futureeval-header";
import { FE_COLORS } from "../theme";

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
          "mx-auto box-content max-w-[1044px] px-4 pt-6 min-[376px]:pt-8 sm:px-10 md:px-16 md:pt-10 lg:pt-12",
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
          <div className="mt-8 sm:mt-10 lg:mt-12">
            <h1
              className={cn(
                "m-0 max-w-3xl text-[24px] font-bold leading-[116%] sm:text-[32px] sm:leading-[40px] lg:text-4xl",
                FE_COLORS.textHeading
              )}
            >
              Measuring the forecasting accuracy of AI
            </h1>
            <ul
              className={cn(
                "m-0 mt-4 max-w-3xl list-disc pl-5 font-geist-mono text-sm sm:text-base",
                FE_COLORS.textSubheading
              )}
            >
              <li>
                Model Benchmark: How well AI models perform over time with a
                standardized prompt
              </li>
              <li>
                Bot Competition: Compete with credits in seasonal tournaments to
                build the best forecasting bots using scaffolding and prompts.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureEvalHeroBanner;

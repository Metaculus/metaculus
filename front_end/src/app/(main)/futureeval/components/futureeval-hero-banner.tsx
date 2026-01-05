"use client";

import { useTranslations } from "next-intl";
import React from "react";

import cn from "@/utils/core/cn";

import FutureEvalHeader, { TabItem } from "./futureeval-header";

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
  const t = useTranslations();
  const showHero = activeTab === "benchmark";

  return (
    <div className="w-full bg-violet-100 dark:bg-violet-950">
      <div
        className={cn(
          "mx-auto box-content max-w-[1044px] px-4 pt-8 min-[376px]:pt-10 sm:px-10 md:px-16 md:pt-12 lg:pt-14",
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
          <div className="mt-10 sm:mt-12 lg:mt-14">
            <h1 className="m-0 text-xl font-bold leading-tight text-gray-900 dark:text-gray-100 sm:text-2xl md:text-3xl lg:text-4xl">
              {t("aibBenchmarkHeroTitle")}
            </h1>
            <p className="m-0 mt-4 max-w-3xl font-geist-mono text-sm text-gray-700 dark:text-gray-300 sm:text-base">
              {t("aibBenchmarkHeroSubtitle")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FutureEvalHeroBanner;

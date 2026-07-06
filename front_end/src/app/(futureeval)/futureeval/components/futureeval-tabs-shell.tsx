"use client";

import React from "react";

import { TabItem } from "./futureeval-header";
import FutureEvalHeroBanner from "./futureeval-hero-banner";
import FutureEvalNavbar from "./futureeval-navbar";
import { FE_COLORS } from "../theme";

export type Section = {
  value: "benchmark" | "methodology" | "participate" | "partner" | "news";
  href: string;
  label: string;
  content: React.ReactNode;
};

type Props = {
  current: Section["value"];
  sections: Section[];
};

const FutureEvalTabsShell: React.FC<Props> = ({ current, sections }) => {
  const activeSection = sections.find((s) => s.value === current);

  // Convert sections to tab items for the header
  const tabs: TabItem[] = sections.map((s) => ({
    value: s.value,
    href: s.href,
    label: s.label,
  }));

  return (
    <div className="font-sans">
      {/* Custom FutureEval navbar */}
      <FutureEvalNavbar />

      {/* Hero banner - edge to edge */}
      <FutureEvalHeroBanner tabs={tabs} activeTab={current} />

      {/* Tab content */}
      {activeSection && (
        <div className={FE_COLORS.bgPrimary}>
          <div className="mx-auto box-content max-w-[1044px] space-y-[60px] px-4 pb-[58px] sm:px-10 md:px-16 lg:pb-[143px] 2xl:space-y-[120px] 2xl:pt-[120px]">
            {activeSection.content}
          </div>
        </div>
      )}
    </div>
  );
};

export default FutureEvalTabsShell;

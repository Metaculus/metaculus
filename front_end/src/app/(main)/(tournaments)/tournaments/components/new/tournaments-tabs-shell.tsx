"use client";

import React from "react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import cn from "@/utils/core/cn";

import { Section, TournamentsSection } from "../../types";

type Props = {
  current: TournamentsSection;
  sections: Section[];
};

const TournamentsTabsShell: React.FC<Props> = ({ current, sections }) => {
  return (
    <Tabs defaultValue={current} className="bg-transparent dark:bg-transparent">
      <TabsList className="gap-1 bg-transparent py-0 dark:bg-transparent lg:justify-start lg:gap-3">
        {sections.map((tab) => (
          <TabsTab
            className={cn(
              "px-2 text-sm no-underline sm:px-2 sm:text-sm lg:px-5 lg:text-lg"
            )}
            dynamicClassName={(isActive) =>
              !isActive
                ? `hover:bg-blue-400 dark:hover:bg-blue-400-dark text-blue-800 dark:text-blue-800-dark ${tab.value === "archived" && "bg-transparent text-blue-600 dark:text-blue-600-dark lg:text-blue-800 lg:dark:text-blue-800-dark"}`
                : ""
            }
            key={tab.value}
            value={tab.value}
            href={tab.href}
          >
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TournamentsTabsShell;

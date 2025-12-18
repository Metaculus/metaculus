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
    <Tabs defaultValue={current}>
      <TabsList className="justify-center gap-3 py-0 lg:justify-start">
        {sections.map((tab) => (
          <TabsTab
            className={cn("no-underline")}
            dynamicClassName={(isActive) =>
              !isActive
                ? `hover:bg-blue-400 dark:hover:bg-blue-400-dark text-blue-800 dark:text-blue-800-dark ${tab.value === "archived" && "bg-transparent"}`
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

"use client";

import { useRouter } from "next/navigation";
import React, { useCallback } from "react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import cn from "@/utils/core/cn";

import { useTournamentsSection } from "./tournaments_provider";
import { Section, TournamentsSection } from "../types";

type Props = {
  current: TournamentsSection;
  sections: Section[];
};

const TournamentsTabsShell: React.FC<Props> = ({ current, sections }) => {
  const { isSearching } = useTournamentsSection();
  const router = useRouter();

  const handleTabClick = useCallback(
    (e: React.MouseEvent, tab: Section) => {
      if (isSearching) {
        e.preventDefault();
        router.push(tab.href);
      }
    },
    [isSearching, router]
  );

  return (
    <Tabs defaultValue={current} className="bg-transparent dark:bg-transparent">
      <TabsList
        className={cn(
          "gap-1 bg-transparent py-0 dark:bg-transparent lg:justify-start lg:gap-3",
          isSearching && "opacity-35 transition-opacity hover:opacity-100"
        )}
      >
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
            onClick={(e) => handleTabClick(e, tab)}
          >
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default TournamentsTabsShell;

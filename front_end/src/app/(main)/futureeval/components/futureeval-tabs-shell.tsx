"use client";

import React from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";

export type Section = {
  value: "benchmark" | "info" | "news";
  href: string;
  icon: React.ReactNode;
  label: string;
  content: React.ReactNode;
};

type Props = {
  current: Section["value"];
  sections: Section[];
};

const FutureEvalTabsShell: React.FC<Props> = ({ current, sections }) => {
  return (
    <Tabs variant="group" defaultValue={current}>
      <TabsList className="mt-8 justify-center bg-gray-0 py-0 dark:bg-gray-950 lg:justify-start">
        {sections.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            href={tab.href}
            scrollOnSelect={!tab.href}
          >
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
      {sections.map((tab) => (
        <TabsSection
          className="mt-0 space-y-[60px] bg-gray-0 pt-[60px] dark:bg-gray-950 2xl:space-y-[120px] 2xl:pt-[120px]"
          key={tab.value}
          value={tab.value}
          suppress={false}
          placeholder={<div className="h-[500px]" />}
        >
          {tab.content}
        </TabsSection>
      ))}
    </Tabs>
  );
};

export default FutureEvalTabsShell;

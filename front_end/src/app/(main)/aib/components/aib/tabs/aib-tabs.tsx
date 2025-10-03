import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faBook, faBullseye, faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";

import AIBBenchmarkTab from "./benchmark/aib-benchmark-tab";

const AIBTabs: React.FC = () => {
  return (
    <Tabs
      variant="group"
      defaultValue="benchmark"
      className="bg-blue-200 dark:bg-blue-50-dark"
    >
      <TabsList className="mt-8 py-0 dark:bg-blue-50-dark">
        {AIB_TABS.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>
      {AIB_TABS.map((tab) => (
        <TabsSection
          className="mt-[120px] space-y-[120px]"
          key={tab.value}
          value={tab.value}
        >
          {tab.content}
        </TabsSection>
      ))}
    </Tabs>
  );
};

const AIB_TABS: {
  value: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}[] = [
  {
    value: "benchmark",
    label: "Benchmark",
    icon: <FontAwesomeIcon className="scale-[1.11]" icon={faBullseye} />,
    content: <AIBBenchmarkTab />,
  },
  {
    value: "info",
    label: "Info",
    icon: (
      <span className="relative inline-block">
        <FontAwesomeIcon icon={faCircle} className="h-5 w-5" />
        <FontAwesomeIcon
          icon={faInfo}
          className="absolute right-[20%] top-[43%] h-3 w-3 -translate-y-1/2"
        />
      </span>
    ),
    content: "Info content",
  },
  {
    value: "news",
    label: "News",
    icon: <FontAwesomeIcon className="scale-[1.11]" icon={faBook} />,
    content: "News content",
  },
];

export default AIBTabs;

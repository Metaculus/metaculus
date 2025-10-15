import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faBook, faBullseye, faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";

import AIBBenchmarkTab from "./benchmark/aib-benchmark-tab";

const AIBTabs: React.FC = () => {
  const t = useTranslations();

  const TABS: {
    value: string;
    label: React.ReactNode;
    icon: React.ReactNode;
    content: React.ReactNode;
  }[] = [
    {
      value: "benchmark",
      label: t("aibTabsBenchmark"),
      icon: (
        <FontAwesomeIcon
          className="scale-[1] sm:scale-[1.11]"
          icon={faBullseye}
        />
      ),
      content: <AIBBenchmarkTab />,
    },
    {
      value: "info",
      label: t("aibTabsInfo"),
      icon: (
        <span className="relative inline-block scale-[0.8] sm:scale-[100%]">
          <FontAwesomeIcon icon={faCircle} className="h-5 w-5" />
          <FontAwesomeIcon
            icon={faInfo}
            className="absolute right-[20%] top-[43%] h-3 w-3 -translate-y-1/2"
          />
        </span>
      ),
      content: "",
    },
    {
      value: "news",
      label: t("aibTabsNews"),
      icon: (
        <FontAwesomeIcon className="scale-[1] sm:scale-[1.11]" icon={faBook} />
      ),
      content: "",
    },
  ];

  return (
    <Tabs
      variant="group"
      defaultValue="benchmark"
      className="bg-blue-200 dark:bg-blue-50-dark "
    >
      <TabsList className="mt-8 justify-center py-0 dark:bg-blue-50-dark lg:justify-start">
        {TABS.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} icon={tab.icon}>
            {tab.label}
          </TabsTab>
        ))}
      </TabsList>

      {TABS.map((tab) => (
        <TabsSection
          className="mt-[60px] space-y-[60px] 2xl:mt-[120px] 2xl:space-y-[120px]"
          key={tab.value}
          value={tab.value}
        >
          {tab.content}
        </TabsSection>
      ))}
    </Tabs>
  );
};

export default AIBTabs;

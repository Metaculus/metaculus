import React from "react";

import AIBTabsShell, {
  BenchmarkIcon,
  InfoIcon,
  NewsIcon,
} from "./aib-tabs-shell";
import AIBBenchmarkTab from "./benchmark/aib-benchmark-tab";
import AIBInfoTab from "./info/aib-info-tab";
import AIBNewsTab from "./news/aib-news-tab";

const AIBTabs: React.FC = async () => {
  const sections = [
    {
      value: "benchmark" as const,
      href: "/aib",
      icon: BenchmarkIcon,
      labelKey: "aibTabsBenchmark",
      content: <AIBBenchmarkTab />,
    },
    {
      value: "info" as const,
      href: "/aib/info",
      icon: InfoIcon,
      labelKey: "aibTabsInfo",
      content: <AIBInfoTab />,
    },
    {
      value: "news" as const,
      href: "/aib/news",
      icon: NewsIcon,
      labelKey: "aibTabsNews",
      content: <AIBNewsTab />,
    },
  ];

  return <AIBTabsShell sections={sections} />;
};

export default AIBTabs;

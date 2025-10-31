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
      href: "/futureeval",
      icon: BenchmarkIcon,
      labelKey: "aibTabsBenchmark",
      content: <AIBBenchmarkTab />,
    },
    {
      value: "info" as const,
      href: "/futureeval/info",
      icon: InfoIcon,
      labelKey: "aibTabsInfo",
      content: <AIBInfoTab />,
    },
    {
      value: "news" as const,
      href: "/futureeval/news",
      icon: NewsIcon,
      labelKey: "aibTabsNews",
      content: <AIBNewsTab />,
    },
  ];

  return <AIBTabsShell sections={sections} />;
};

export default AIBTabs;

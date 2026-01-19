import { getTranslations } from "next-intl/server";
import React from "react";

import FutureEvalBenchmarkTab from "./benchmark/futureeval-benchmark-tab";
import FutureEvalMethodologyTab from "./futureeval-methodology-tab";
import FutureEvalParticipateTab from "./futureeval-participate-tab";
import FutureEvalTabsShell, { Section } from "./futureeval-tabs-shell";
import FutureEvalNewsTab from "./news/futureeval-news-tab";

type Props = {
  current: Section["value"];
};

const FutureEvalTabs: React.FC<Props> = async ({ current }) => {
  const t = await getTranslations();

  const sections: Section[] = [
    {
      value: "benchmark",
      href: "/futureeval",
      label: t("aibTabsBenchmark"),
      content: <FutureEvalBenchmarkTab />,
    },
    {
      value: "methodology",
      href: "/futureeval/methodology",
      label: t("aibTabsMethodology"),
      content: <FutureEvalMethodologyTab />,
    },
    {
      value: "news",
      href: "/futureeval/news",
      label: t("aibTabsNews"),
      content: <FutureEvalNewsTab />,
    },
    {
      value: "participate",
      href: "/futureeval/participate",
      label: t("aibTabsParticipate"),
      content: <FutureEvalParticipateTab />,
    },
  ];

  return <FutureEvalTabsShell current={current} sections={sections} />;
};

export default FutureEvalTabs;

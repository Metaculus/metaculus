import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faBook, faBullseye, faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";
import React from "react";

import AIBTabsShell, { Section } from "./aib-tabs-shell";
import AIBBenchmarkTab from "./benchmark/aib-benchmark-tab";
import AIBInfoTab from "./info/aib-info-tab";
import AIBNewsTab from "./news/aib-news-tab";

type Props = {
  current: Section["value"];
};

const AIBTabs: React.FC<Props> = async ({ current }) => {
  const t = await getTranslations();

  const sections: Section[] = [
    {
      value: "benchmark",
      href: "/futureeval",
      icon: (
        <FontAwesomeIcon
          className="scale-[1] sm:scale-[1.11]"
          icon={faBullseye}
        />
      ),
      label: t("aibTabsBenchmark"),
      content: <AIBBenchmarkTab />,
    },
    {
      value: "info",
      href: "/futureeval/info",
      icon: (
        <span className="relative inline-block scale-[0.8] sm:scale-[100%]">
          <FontAwesomeIcon icon={faCircle} className="h-5 w-5" />
          <FontAwesomeIcon
            icon={faInfo}
            className="absolute right-[20%] top-[43%] h-3 w-3 -translate-y-1/2"
          />
        </span>
      ),
      label: t("aibTabsInfo"),
      content: <AIBInfoTab />,
    },
    {
      value: "news",
      href: "/futureeval/news",
      icon: (
        <FontAwesomeIcon className="scale-[1] sm:scale-[1.11]" icon={faBook} />
      ),
      label: t("aibTabsNews"),
      content: <AIBNewsTab />,
    },
  ];

  return <AIBTabsShell current={current} sections={sections} />;
};

export default AIBTabs;

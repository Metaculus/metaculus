"use client";

import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faBook, faBullseye, faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";

type Section = {
  value: "benchmark" | "info" | "news";
  href: string;
  icon: React.ReactNode;
  labelKey: string;
  content: React.ReactNode;
};

export default function AIBTabsShell({ sections }: { sections: Section[] }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  const current: Section["value"] = useMemo(() => {
    if (pathname.includes("/futureeval/news")) return "news";
    if (pathname.includes("/futureeval/info")) return "info";
    return "benchmark";
  }, [pathname]);

  const [navigatingTo, setNavigatingTo] = useState<Section["value"] | null>(
    null
  );

  useEffect(() => {
    if (navigatingTo && current === navigatingTo) setNavigatingTo(null);
  }, [current, navigatingTo]);

  const suppress = navigatingTo !== null;

  return (
    <Tabs
      variant="group"
      defaultValue={current}
      className="bg-blue-200 dark:bg-blue-200-dark"
    >
      <TabsList className="mt-8 justify-center py-0 dark:bg-blue-200-dark lg:justify-start">
        {sections.map((tab) => (
          <TabsTab
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            onSelect={() => {
              setNavigatingTo(tab.value);
              router.push(tab.href);
            }}
            scrollOnSelect={false}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </TabsTab>
        ))}
      </TabsList>

      {sections.map((tab) => (
        <TabsSection
          className="mt-[60px] space-y-[60px] 2xl:mt-[120px] 2xl:space-y-[120px]"
          key={tab.value}
          value={tab.value}
          suppress={suppress}
          placeholder={<div className="h-[500px]" />}
        >
          {tab.content}
        </TabsSection>
      ))}
    </Tabs>
  );
}

export const BenchmarkIcon = (
  <FontAwesomeIcon className="scale-[1] sm:scale-[1.11]" icon={faBullseye} />
);
export const InfoIcon = (
  <span className="relative inline-block scale-[0.8] sm:scale-[100%]">
    <FontAwesomeIcon icon={faCircle} className="h-5 w-5" />
    <FontAwesomeIcon
      icon={faInfo}
      className="absolute right-[20%] top-[43%] h-3 w-3 -translate-y-1/2"
    />
  </span>
);
export const NewsIcon = (
  <FontAwesomeIcon className="scale-[1] sm:scale-[1.11]" icon={faBook} />
);

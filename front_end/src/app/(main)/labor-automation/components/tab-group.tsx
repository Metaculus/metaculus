"use client";

import { Scrollspy } from "@/components/ui/scrollspy";
import cn from "@/utils/core/cn";

export function TabGroup({
  tabs,
  className,
}: {
  tabs: { id: string; label: string }[];
  className?: string;
}) {
  return (
    <Scrollspy
      offset={48}
      history={false}
      scrollActiveIntoView
      className={cn("flex items-center gap-3", className)}
    >
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            type="button"
            data-scrollspy-anchor={tab.id}
            className={cn(
              "h-8 shrink-0 grow-0 scroll-mx-4 rounded-full px-2 text-sm font-[450] leading-7 no-underline transition-colors md:h-10 md:px-5 md:text-lg",
              "data-[active=true]:bg-blue-800 data-[active=true]:text-gray-0 data-[active=true]:dark:bg-blue-800-dark data-[active=true]:dark:text-gray-0-dark",
              "bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-200-dark dark:text-blue-800-dark dark:hover:bg-blue-300-dark"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </Scrollspy>
  );
}

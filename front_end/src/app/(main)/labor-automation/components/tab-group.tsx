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
      className={cn("flex items-center gap-3", className)}
    >
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            type="button"
            data-scrollspy-anchor={tab.id}
            className={cn(
              "rounded-full px-5 py-1.5 text-lg font-medium leading-7 no-underline transition-colors",
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

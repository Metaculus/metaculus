"use client";

import { FC } from "react";
import ScrollSpy from "react-scrollspy-navigation";

import cn from "@/utils/core/cn";

type Props = {
  tabs: { id: string; label: string }[];
  className?: string;
};

const TabGroup: FC<Props> = ({ tabs, className }) => {
  return (
    <ScrollSpy activeAttr offsetTop={48}>
      <div className={cn("flex items-center gap-3", className)}>
        {tabs.map((tab) => {
          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={cn(
                "rounded-full px-5 py-1.5 text-lg font-medium leading-7 no-underline transition-colors",
                "data-[active=true]:bg-blue-800 data-[active=true]:text-gray-0 data-[active=true]:dark:bg-blue-800-dark data-[active=true]:dark:text-gray-0-dark",
                "bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-200-dark dark:text-blue-800-dark dark:hover:bg-blue-300-dark"
              )}
            >
              {tab.label}
            </a>
          );
        })}
      </div>
    </ScrollSpy>
  );
};

export default TabGroup;

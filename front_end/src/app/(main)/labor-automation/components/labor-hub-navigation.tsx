"use client";

import { useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

import { TabGroup } from "./tab-group";

export default function LaborHubNavigation({
  tabs,
}: {
  tabs: { id: string; label: string }[];
}) {
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsSticky(!entry.isIntersecting);
        }
      },
      {
        threshold: [0],
        rootMargin: "-48px 0px 0px 0px", // Account for top-12 offset (48px)
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-0" />
      <div className="pointer-events-none sticky top-12 z-[100] mx-auto w-full max-w-7xl pb-4 transition-all sm:pb-8 xl:px-16">
        <div
          className={cn(
            "border border-t-0 backdrop-blur-sm transition-all xl:rounded-b-md",
            isSticky
              ? "mb-7 border-blue-500 bg-gray-0/90 py-3 sm:mb-10 md:mb-12 md:py-4 dark:border-blue-500-dark dark:bg-gray-0-dark/90"
              : "border-gray-0 bg-gray-0 py-5 sm:py-8 md:py-10 dark:border-gray-0-dark dark:bg-gray-0-dark"
          )}
        >
          <div className="pointer-events-auto w-full overflow-x-auto no-scrollbar">
            <div
              className={cn(
                "flex w-max before:shrink-0 before:content-[''] after:shrink-0 after:content-['']",
                isSticky
                  ? "before:w-4 after:w-4"
                  : "before:w-5 after:w-5 sm:before:w-8 sm:after:w-8 md:before:w-10 md:after:w-10"
              )}
            >
              <TabGroup tabs={tabs} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

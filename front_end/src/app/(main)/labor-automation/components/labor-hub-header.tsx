"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

import InfoPopover from "./info-popover";
import { TabGroup } from "./tab-group";

type Props = {
  tabs: { id: string; label: string }[];
  infoContent?: ReactNode;
};

export default function LaborHubHeader({ tabs, infoContent }: Props) {
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
      <div className="pointer-events-none sticky top-12 z-[100] mx-auto w-full max-w-7xl pb-8 transition-all sm:px-8 md:px-12 lg:px-16">
        <div
          className={cn(
            "border border-t-0 backdrop-blur-sm transition-all",
            isSticky
              ? "mb-12 rounded-b-[2rem] border-blue-500 bg-gray-0/90 px-4 py-4 dark:border-blue-500-dark dark:bg-gray-0-dark/90"
              : "rounded-b-md border-gray-0 bg-gray-0 px-10 py-10 dark:border-gray-0-dark dark:bg-gray-0-dark"
          )}
        >
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <TabGroup tabs={tabs} />
            {infoContent && (
              <InfoPopover floatingStrategy={isSticky ? "fixed" : "absolute"}>
                {infoContent}
              </InfoPopover>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  HubPdf,
  PdfDownloadButton,
} from "@/app/(main)/labor-hub/components/pdf_download_button";
import { useTopChromeHeightPx } from "@/hooks/use_top_chrome_height";
import cn from "@/utils/core/cn";

export type CloserLookTab = { id: string; label: string; panel: ReactNode };

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => decodeURIComponent(window.location.hash.slice(1));
const getServerHash = () => "";

/**
 * Real tabs: only the active panel is shown (all of them in print). The URL hash picks
 * the tab, so disease links in the takeaways (#measles) and shared links open it.
 */
export function CloserLookTabs({
  id,
  title,
  tabs,
  pdf,
}: {
  id: string;
  title: string;
  tabs: CloserLookTab[];
  pdf: HubPdf;
}) {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const activeId = tabs.some((tab) => tab.id === hash) ? hash : tabs[0]?.id;
  const [isStuck, setIsStuck] = useState(false);
  const topChromeHeight = useTopChromeHeightPx();
  const rootRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const previousHashRef = useRef(hash);
  const isTabClickRef = useRef(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsStuck(!entry.isIntersecting);
        }
      },
      { threshold: [0], rootMargin: `-${topChromeHeight}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [topChromeHeight]);

  // A hash from a link or page load (not a tab click) scrolls the tabs into view.
  useEffect(() => {
    if (hash === previousHashRef.current) return;
    previousHashRef.current = hash;
    if (isTabClickRef.current) {
      isTabClickRef.current = false;
      return;
    }
    if (tabs.some((tab) => tab.id === hash)) {
      rootRef.current?.scrollIntoView({ block: "start" });
    }
  }, [hash, tabs]);

  // Keep the active tab visible in the horizontally scrolling tab row.
  useEffect(() => {
    const tabList = tabListRef.current;
    const tab = tabList?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!tabList || !tab) return;
    const left = tab.offsetLeft - 16;
    const right = tab.offsetLeft + tab.offsetWidth + 16;
    if (left < tabList.scrollLeft) {
      tabList.scrollTo({ left, behavior: "smooth" });
    } else if (right > tabList.scrollLeft + tabList.clientWidth) {
      tabList.scrollTo({
        left: right - tabList.clientWidth,
        behavior: "smooth",
      });
    }
  }, [activeId]);

  const selectTab = (tabId: string) => {
    if (tabId === activeId) return;
    isTabClickRef.current = true;
    window.history.replaceState(window.history.state, "", `#${tabId}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    // When the tab row is stuck, jump back so the new panel starts at its top.
    const sentinelTop = sentinelRef.current?.getBoundingClientRect().top;
    if (sentinelTop !== undefined && sentinelTop < topChromeHeight) {
      window.scrollTo({ top: window.scrollY + sentinelTop - topChromeHeight });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === activeId);
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : null;
    const nextTab = nextIndex === null ? undefined : tabs[nextIndex];
    if (!nextTab) return;
    event.preventDefault();
    selectTab(nextTab.id);
    tabListRef.current
      ?.querySelector<HTMLElement>(`#${id}-tab-${nextTab.id}`)
      ?.focus();
  };

  return (
    <section ref={rootRef} id={id} className="flex flex-col">
      <h2 className="mx-4 my-0 text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:mx-0 md:text-3xl">
        {title}
      </h2>
      <div ref={sentinelRef} className="h-0" />
      <div
        className={cn(
          "sticky top-header z-[100] -mx-1 mb-4 flex items-center gap-3 bg-blue-200/95 px-1 py-4 backdrop-blur-sm transition-shadow dark:bg-blue-50-dark/95 sm:-mx-8 sm:px-8 md:mb-6 xl:-mx-16 xl:px-16 print:hidden",
          isStuck &&
            "shadow-[0_1px_0_0] shadow-blue-400 dark:shadow-blue-400-dark"
        )}
      >
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={title}
          onKeyDown={handleKeyDown}
          className="relative flex min-w-0 flex-1 gap-2 overflow-x-auto px-3 no-scrollbar sm:px-0"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                id={`${id}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${id}-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-medium transition-colors md:px-5 md:py-2.5 md:text-base",
                  isActive
                    ? "border-blue-800 bg-blue-800 text-gray-0 dark:border-blue-800-dark dark:bg-blue-800-dark dark:text-gray-0-dark"
                    : "border-gray-300 bg-gray-0 text-blue-800 hover:border-blue-500 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:border-blue-500-dark"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <PdfDownloadButton pdf={pdf} className="mr-3 shrink-0 sm:mr-0" />
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${id}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.id}`}
          className={cn(
            tab.id === activeId ? "block" : "hidden",
            "print:mb-8 print:block"
          )}
        >
          {tab.panel}
        </div>
      ))}
    </section>
  );
}

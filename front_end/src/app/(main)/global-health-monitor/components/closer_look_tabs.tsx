"use client";

import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useTopChromeHeightPx } from "@/hooks/use_top_chrome_height";
import cn from "@/utils/core/cn";

export type CloserLookTab = {
  id: string;
  label: string;
  panel: ReactNode;
  // Other hashes that open this tab, e.g. the diseases grouped inside it.
  aliases?: string[];
};

function findTab(tabs: CloserLookTab[], hash: string) {
  return tabs.find((tab) => tab.id === hash || tab.aliases?.includes(hash));
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => decodeURIComponent(window.location.hash.slice(1));
const getServerHash = () => "";

// Same width and gutters as the page's content column.
const containerClassName =
  "mx-auto w-full max-w-7xl px-1 sm:px-8 xl:px-16 print:px-0";
// The Tournaments page's sticky header glass.
const stuckClassName =
  "border-b border-blue-400/50 bg-white/70 backdrop-blur-md dark:border-blue-400-dark/50 dark:bg-slate-950/45";

/**
 * Real tabs: only the active panel is shown (all of them in print). The URL hash picks
 * the tab, so disease links in the takeaways (#measles) and shared links open it.
 * Rendered outside the content column so the sticky tab bar can span the viewport.
 */
export function CloserLookTabs({
  id,
  title,
  tabs,
}: {
  id: string;
  title: string;
  tabs: CloserLookTab[];
}) {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash);
  const activeId = (findTab(tabs, hash) ?? tabs[0])?.id;
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
    if (findTab(tabs, hash)) {
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
      <div className={containerClassName}>
        <h2 className="mx-4 my-0 text-2xl font-bold tracking-tight text-blue-800 dark:text-blue-800-dark sm:mx-0 md:text-3xl">
          {title}
        </h2>
      </div>
      <div ref={sentinelRef} className="h-px w-full" aria-hidden />
      <div
        className={cn(
          "sticky top-header z-[100] mb-2 border-b transition-colors md:mb-4 print:hidden",
          isStuck ? stuckClassName : "border-transparent bg-transparent"
        )}
      >
        <div className={cn(containerClassName, "py-2 md:py-3")}>
          <div
            ref={tabListRef}
            role="tablist"
            aria-label={title}
            onKeyDown={handleKeyDown}
            className="relative flex gap-1 overflow-x-auto px-3 no-scrollbar sm:px-0 lg:gap-3"
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
                    "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors sm:px-5 sm:py-1.5 sm:text-lg sm:leading-[26px]",
                    isActive
                      ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
                      : "bg-gray-0 text-blue-800 hover:bg-blue-400 dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-400-dark"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className={containerClassName}>
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
      </div>
    </section>
  );
}

"use client";

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import cn from "@/utils/core/cn";

export type TocItem = { id: string; label: string };
export type TocSection = { title: string; items: TocItem[] };

type Props = {
  sections: TocSection[];
  title: string;
};

const FaqTocSidebar: FC<Props> = ({ sections, title }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allIds = useMemo(
    () => sections.flatMap((s) => s.items.map((i) => i.id)),
    [sections]
  );

  useEffect(() => {
    if (typeof window === "undefined" || allIds.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }
        const firstVisible = allIds.find((id) => visible.has(id));
        if (firstVisible) {
          setActiveId(firstVisible);
        }
      },
      { rootMargin: "-80px 0px -55% 0px", threshold: 0 }
    );

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [allIds]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const handleItemClick = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const tocList = (
    <nav aria-label={title} className="text-sm">
      {sections.map((section, idx) => (
        <div key={section.title} className={cn(idx > 0 && "mt-5")}>
          <p className="m-0 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {section.title}
          </p>
          <ul className="m-0 list-none p-0">
            {section.items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li key={item.id} className="m-0 p-0">
                  <a
                    href={`#${item.id}`}
                    onClick={handleItemClick}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "block rounded border-l-2 px-3 py-1 leading-snug no-underline transition-colors",
                      isActive
                        ? "border-blue-600 bg-blue-100 font-medium text-blue-900 dark:border-blue-300 dark:bg-blue-800/40 dark:text-blue-100"
                        : "border-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-800 dark:text-gray-300 dark:hover:bg-blue-800/30 dark:hover:text-blue-200"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 lg:hidden"
        aria-label={`Open ${title}`}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 cursor-default bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-blue-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-blue-700">
              <h2 className="m-0 text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-blue-800"
                aria-label="Close navigation"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{tocList}</div>
          </aside>
        </div>
      )}

      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-[calc(theme(spacing.header)+1rem)] max-h-[calc(100dvh-theme(spacing.header)-2rem)] overflow-y-auto pr-2">
          {tocList}
        </div>
      </aside>
    </>
  );
};

export default FaqTocSidebar;

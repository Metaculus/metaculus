"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useCallback, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

import InsightCard from "./insight_card";
import { CommunityInsight } from "../helpers/fetch_community_insights";

const SCROLL_DELTA = 340;

type Props = {
  insights: CommunityInsight[];
  title: ReactNode;
};

const InsightsCarousel: FC<Props> = ({ insights, title }) => {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, insights.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -SCROLL_DELTA : SCROLL_DELTA,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {title}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label={t("midtermsHubScrollLeft")}
            className={cn(scrollButtonClass, !canScrollLeft && "opacity-40")}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label={t("midtermsHubScrollRight")}
            className={cn(scrollButtonClass, !canScrollRight && "opacity-40")}
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {insights.map((insight, i) => (
            <InsightCard key={i} insight={insight} />
          ))}
        </div>
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-gray-0 to-transparent transition-opacity duration-200 dark:from-gray-0-dark md:w-16",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-gray-0 to-transparent transition-opacity duration-200 dark:from-gray-0-dark md:w-16",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};

const scrollButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-blue-700 transition-colors hover:border-blue-500 hover:text-blue-800 disabled:cursor-not-allowed dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-500-dark dark:hover:text-blue-800-dark";

export default InsightsCarousel;

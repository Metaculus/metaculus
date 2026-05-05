"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useRef } from "react";

import cn from "@/utils/core/cn";

import InsightCard from "./insight_card";
import { CommunityInsight } from "../helpers/fetch_community_insights";

const SCROLL_DELTA = 320;

type Props = {
  insights: CommunityInsight[];
};

const InsightsCarousel: FC<Props> = ({ insights }) => {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -SCROLL_DELTA : SCROLL_DELTA,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label={t("midtermsHubScrollLeft")}
          className={cn(scrollButtonClass)}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label={t("midtermsHubScrollRight")}
          className={cn(scrollButtonClass)}
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 no-scrollbar"
      >
        {insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </div>
    </div>
  );
};

const scrollButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-gray-0 text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-700-dark dark:hover:border-gray-400-dark dark:hover:text-gray-900-dark";

export default InsightsCarousel;

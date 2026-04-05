"use client";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isConditionalPost, isNotebookPost } from "@/utils/questions/helpers";

import HomepagePostCard from "./homepage_post_card";

type Props = {
  initialPosts: PostWithForecasts[];
  className?: string;
};

const CARD_WIDTH_MOBILE = 220;
const CARD_GAP = 16;

const ForecastsCarouselSection: FC<Props> = ({ initialPosts, className }) => {
  const t = useTranslations();
  const posts = initialPosts.filter(
    (post) => !isConditionalPost(post) && !isNotebookPost(post)
  );

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
  }, [updateScrollState, posts.length]);

  const scroll = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;

    const isMobile = window.innerWidth < 768;
    const amount = isMobile
      ? CARD_WIDTH_MOBILE + CARD_GAP
      : el.clientWidth * 0.33;

    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }, []);

  return (
    <section className={cn("relative", className)}>
      <div
        ref={scrollRef}
        role="region"
        aria-label={t("forecastsCarousel")}
        tabIndex={0}
        className="flex snap-x snap-proximity gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <div
            key={post.id}
            className="w-[220px] flex-none snap-start md:w-[294px]"
          >
            <HomepagePostCard post={post} />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute right-0 top-0 h-full w-[50px] bg-gradient-to-l from-blue-200 to-transparent transition-opacity duration-200 md:w-[60px]",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />
      <button
        type="button"
        aria-label={t("scrollLeft")}
        disabled={!canScrollLeft}
        onClick={() => scroll(-1)}
        className={cn(
          "absolute left-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-blue-900 text-gray-200 transition-opacity duration-200 md:left-4 md:size-10",
          canScrollLeft ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm md:text-base" />
      </button>
      <button
        type="button"
        aria-label={t("scrollRight")}
        disabled={!canScrollRight}
        onClick={() => scroll(1)}
        className={cn(
          "absolute right-2 top-1/2 size-8 -translate-y-1/2 rounded-full bg-blue-900 text-gray-200 transition-opacity duration-200 md:right-4 md:size-10",
          canScrollRight ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <FontAwesomeIcon icon={faArrowRight} className="text-sm md:text-base" />
      </button>
    </section>
  );
};

export default ForecastsCarouselSection;

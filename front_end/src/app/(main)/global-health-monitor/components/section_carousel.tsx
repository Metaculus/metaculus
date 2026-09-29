"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import {
  Children,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

const scrollButtonClassName =
  "flex size-8 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-blue-700 transition-colors hover:border-blue-500 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-500-dark dark:hover:text-blue-800-dark";

/**
 * One scroll-snap row for every breakpoint (swipe on touch, chevrons on desktop, a grid
 * in print), so each card and its charts render once.
 */
export function SectionCarousel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const slides = Children.toArray(children);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 1);
    setCanScrollRight(
      element.scrollLeft + element.clientWidth < element.scrollWidth - 1
    );
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollState();
    element.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, slides.length]);

  const scrollBy = (direction: -1 | 1) => {
    const element = scrollRef.current;
    const firstSlide = element?.firstElementChild as HTMLElement | null;
    if (!element || !firstSlide) return;
    element.scrollBy({
      left: direction * (firstSlide.offsetWidth + 16),
      behavior: "smooth",
    });
  };

  return (
    <div className={className}>
      <div className="mb-3 hidden justify-end gap-2 md:flex print:hidden">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canScrollLeft}
          aria-label={t("scrollLeft")}
          className={scrollButtonClassName}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canScrollRight}
          aria-label={t("scrollRight")}
          className={scrollButtonClassName}
        >
          <FontAwesomeIcon icon={faChevronRight} className="size-3" />
        </button>
      </div>
      <div className="relative">
        <div
          ref={scrollRef}
          className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overflow-y-hidden px-5 pb-2 pt-4 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 print:mx-0 print:grid print:grid-cols-2 print:overflow-visible print:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="w-[85%] shrink-0 snap-start sm:w-[360px] print:w-auto"
            >
              {slide}
            </div>
          ))}
        </div>
        <div
          className={cn(
            "pointer-events-none absolute left-0 top-0 hidden h-full w-12 bg-gradient-to-r from-gray-0 to-transparent transition-opacity dark:from-gray-0-dark md:block print:hidden",
            canScrollLeft ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute right-0 top-0 hidden h-full w-12 bg-gradient-to-l from-gray-0 to-transparent transition-opacity dark:from-gray-0-dark md:block print:hidden",
            canScrollRight ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}

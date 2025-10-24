"use client";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useCallback, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

type SlideBy = { mode: "page" } | { mode: "items"; count: number };
type CarouselNavState = { canPrev: boolean; canNext: boolean };
type GradientVisibility = boolean | { left: boolean; right: boolean };
type Resolver<T> = boolean | ((state: CarouselNavState) => T);
type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemClassName?: string;
  gapClassName?: string;
  slideBy?: SlideBy;
  showGradients?: Resolver<GradientVisibility>;
  gradientFromClass?: string;
  showArrows?: Resolver<boolean>;
  arrowClassName?: string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
  viewportClassName?: string;
  listClassName?: string;
  loop?: boolean;
  wheelToHorizontal?: boolean;
};

function ReusableGradientCarousel<T>(props: Props<T>) {
  const {
    items,
    renderItem,
    itemClassName = "w-[120px] md:w-[210px]",
    gapClassName = "gap-3 md:gap-6",
    slideBy = { mode: "items", count: 2 },
    showGradients = true,
    gradientFromClass = "from-blue-200 dark:from-blue-200-dark",
    showArrows = true,
    arrowClassName = "w-10 h-10 md:w-[44px] md:h-[44px] text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark mt-3 md:text-gray-200 md:dark:text-gray-200-dark rounded-full md:bg-blue-900 md:dark:bg-blue-900-dark",
    prevLabel = "Previous",
    nextLabel = "Next",
    className,
    viewportClassName,
    listClassName,
    loop = false,
    wheelToHorizontal = true,
  } = props;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const recompute = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(loop || scrollLeft > 0);
    setCanNext(loop || scrollLeft + clientWidth < scrollWidth - 1);
  }, [loop]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    recompute();

    const onScroll = () => recompute();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    if (listRef.current) ro.observe(listRef.current);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [recompute]);

  useEffect(() => {
    if (!wheelToHorizontal) return;
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelToHorizontal]);

  const scrollByAmount = useCallback(
    (dir: 1 | -1) => {
      const el = viewportRef.current;
      const list = listRef.current;
      if (!el || !list) return;

      let delta = el.clientWidth;

      if (slideBy.mode === "items") {
        const first = list.firstElementChild as HTMLElement | null;
        if (first) {
          const itemWidth = first.offsetWidth;
          const style = getComputedStyle(list);
          const gap = parseFloat(style.columnGap || style.gap || "0");
          delta =
            slideBy.count * itemWidth + Math.max(0, slideBy.count - 1) * gap;
        }
      }

      const target = el.scrollLeft + dir * delta;
      if (loop) {
        if (dir === 1 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollTo({ left: 0, behavior: "smooth" });
          return;
        }
        if (dir === -1 && el.scrollLeft <= 0) {
          el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
          return;
        }
      }

      el.scrollTo({ left: target, behavior: "smooth" });
    },
    [loop, slideBy]
  );

  const arrowsActive =
    typeof showArrows === "function"
      ? showArrows({ canPrev, canNext })
      : showArrows;
  const arrowsEnabled = typeof showArrows === "function" ? true : showArrows;

  const gradients =
    typeof showGradients === "function"
      ? showGradients({ canPrev, canNext })
      : showGradients;

  let leftGradientVisible, rightGradientVisible;

  if (typeof gradients === "boolean") {
    leftGradientVisible = gradients && canPrev;
    rightGradientVisible = gradients && canNext;
  } else {
    leftGradientVisible = !!gradients?.left && canPrev;
    rightGradientVisible = !!gradients?.right && canNext;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        ref={viewportRef}
        className={cn(
          "overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
          "scroll-snap-type-x mandatory",
          viewportClassName
        )}
      >
        <div
          ref={listRef}
          className={cn("flex", gapClassName, "px-2", "pb-2", listClassName)}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                itemClassName,
                "scroll-snap-align-start shrink-0 first:ml-0 last:mr-0"
              )}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>
      </div>

      <>
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 w-[152px]",
            "bg-gradient-to-r",
            gradientFromClass,
            "to-transparent",
            "transition-opacity duration-200 ease-linear",
            leftGradientVisible ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 w-[152px]",
            "bg-gradient-to-l",
            gradientFromClass,
            "to-transparent",
            "transition-opacity duration-200 ease-linear",
            rightGradientVisible ? "opacity-100" : "opacity-0"
          )}
        />
      </>

      {arrowsEnabled && (
        <>
          <button
            aria-label={prevLabel}
            type="button"
            onClick={() => scrollByAmount(-1)}
            disabled={!canPrev && !loop}
            className={cn(
              "absolute left-[18px] top-1/2 -translate-y-1/2",
              arrowClassName,
              "transition-opacity duration-200 ease-linear",
              arrowsActive && canPrev
                ? "opacity-100"
                : "pointer-events-none opacity-0",
              !canPrev && !loop ? "cursor-not-allowed" : ""
            )}
          >
            <FontAwesomeIcon className="scale-[125%]" icon={faArrowLeft} />
          </button>

          <button
            aria-label={nextLabel}
            type="button"
            onClick={() => scrollByAmount(1)}
            disabled={!canNext && !loop}
            className={cn(
              "absolute right-[18px] top-1/2 -translate-y-1/2",
              arrowClassName,
              "transition-opacity duration-200 ease-linear",
              arrowsActive && canNext
                ? "opacity-100"
                : "pointer-events-none opacity-0",
              !canNext && !loop ? "cursor-not-allowed" : ""
            )}
          >
            <FontAwesomeIcon className="scale-[125%]" icon={faArrowRight} />
          </button>
        </>
      )}
    </div>
  );
}

export default ReusableGradientCarousel;

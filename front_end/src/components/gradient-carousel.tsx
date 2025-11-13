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
  dragScroll?: boolean;
  fadeMs?: number;
};

function ReusableGradientCarousel<T>({
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
  dragScroll = true,
  fadeMs = 200,
}: Props<T>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Dragging state
  const dragging = useRef(false);
  const movedPx = useRef(0);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const DRAG_THRESHOLD = 8;
  const fadeCls = `transition-opacity duration-[${fadeMs}ms] ease-linear`;

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

  // Drag-to-scroll
  useEffect(() => {
    if (!dragScroll) return;
    const vp = viewportRef.current;
    if (!vp) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      movedPx.current = 0;
      startX.current = e.clientX;
      startScroll.current = vp.scrollLeft;
      setIsGrabbing(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      if ((e.buttons & 1) !== 1) return;
      const dx = e.clientX - startX.current;
      movedPx.current = Math.max(movedPx.current, Math.abs(dx));
      vp.scrollLeft = startScroll.current - dx;
    };

    const endDrag = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsGrabbing(false);

      if (movedPx.current > DRAG_THRESHOLD) {
        const cancelOnce = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        window.addEventListener("click", cancelOnce, {
          capture: true,
          once: true,
        });
      }
    };

    vp.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      window.removeEventListener("blur", endDrag);
    };
  }, [dragScroll]);

  // Prevent native drag on images/links
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const preventNativeDrag = (e: DragEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "IMG" || el.closest("a"))) e.preventDefault();
    };
    root.addEventListener("dragstart", preventNativeDrag);
    return () => root.removeEventListener("dragstart", preventNativeDrag);
  }, []);

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

  // Resolver logic
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
          "touch-pan-x snap-x snap-mandatory",
          "[-webkit-overflow-scrolling:touch]",
          dragScroll && (isGrabbing ? "cursor-grabbing" : "cursor-grab"),
          dragScroll && "select-none",
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
                "shrink-0 snap-start first:ml-0 last:mr-0"
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
            fadeCls,
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
            fadeCls,
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
            tabIndex={canPrev || loop ? 0 : -1}
            className={cn(
              "absolute left-[18px] top-1/2 -translate-y-1/2",
              arrowClassName,
              fadeCls,
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
            tabIndex={canNext || loop ? 0 : -1}
            className={cn(
              "absolute right-[18px] top-1/2 -translate-y-1/2",
              arrowClassName,
              fadeCls,
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

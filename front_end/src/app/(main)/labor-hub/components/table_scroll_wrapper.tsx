"use client";

import { type FC, type ReactNode, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

export const TableScrollWrapper: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="group/scrollable relative"
      data-scrolled-x={canScrollLeft || undefined}
    >
      <div ref={ref} className="overflow-x-auto no-scrollbar">
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-blue-200 to-transparent transition-opacity dark:from-blue-800",
          canScrollRight ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

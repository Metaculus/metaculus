"use client";

import React from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  listClassName?: string;
  gapClassName?: string;
  className?: string;
};

function KeyFactorsCarousel<T>({
  items,
  renderItem,
  listClassName,
  gapClassName,
  ...props
}: Props<T>) {
  const isDesktop = useBreakpoint("sm");

  return (
    <ReusableGradientCarousel
      wheelToHorizontal={false}
      items={items}
      showArrows={(state) => {
        if (!isDesktop) return false;
        // Desktop arrows logic:
        // - At start: right gradient + right arrow
        // - Middle: gradients on both ends, but NO arrows
        // - At end: left gradient + left arrow
        return (
          (state.canPrev && !state.canNext) || (!state.canPrev && state.canNext)
        );
      }}
      showGradients={(state) =>
        !isDesktop
          ? {
              left: state.canPrev && !state.canNext,
              right: state.canNext && !state.canPrev,
            }
          : true
      }
      itemClassName=""
      gapClassName={cn("gap-2.5", gapClassName)}
      listClassName={cn("px-0", listClassName)}
      gradientFromClass="from-gray-0 dark:from-gray-0-dark w-[55px]"
      arrowClassName="right-1.5 w-10 h-10 md:w-[44px] md:h-[44px] text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark mt-3 md:text-gray-200 md:dark:text-gray-200-dark rounded-full md:bg-blue-900 md:dark:bg-blue-900-dark"
      renderItem={(item, i) => renderItem(item, i)}
      dragScroll={isDesktop}
      {...props}
    />
  );
}

export default KeyFactorsCarousel;

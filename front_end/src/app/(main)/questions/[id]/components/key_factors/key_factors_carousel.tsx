"use client";

import React from "react";

import ReusableGradientCarousel from "@/components/gradient-carousel";
import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

type Props<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  listClassName?: string;
};

function KeyFactorsCarousel<T>(props: Props<T>) {
  const { items, renderItem, listClassName } = props;

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
      gapClassName="gap-2.5"
      listClassName={cn("px-0", listClassName)}
      gradientFromClass="from-gray-0 dark:from-gray-0-dark"
      renderItem={(item) => renderItem(item)}
    />
  );
}

export default KeyFactorsCarousel;

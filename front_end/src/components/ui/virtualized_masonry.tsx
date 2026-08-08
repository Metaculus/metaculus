"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const INITIAL_VIEWPORT_HEIGHT = 1_000;

type Props<T> = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  columns: number;
  estimateSize: (item: T) => number;
  gap: number;
  getItemKey: (item: T) => string | number;
  items: T[];
  overscan?: number;
  render: (item: T) => ReactNode;
};

export default function VirtualizedMasonry<T>({
  columns,
  estimateSize,
  gap,
  getItemKey,
  items,
  overscan = 6,
  render,
  style,
  ...rest
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const nextScrollMargin = node.getBoundingClientRect().top + window.scrollY;
    setScrollMargin((current) =>
      current === nextScrollMargin ? current : nextScrollMargin
    );
  });

  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: items.length,
    estimateSize: (index) => estimateSize(items[index] as T),
    gap,
    getItemKey: (index) => getItemKey(items[index] as T),
    initialRect: { width: 0, height: INITIAL_VIEWPORT_HEIGHT },
    laneAssignmentMode: "measured",
    lanes: columns,
    overscan,
    scrollMargin,
    useAnimationFrameWithResizeObserver: true,
  });

  return (
    <div
      {...rest}
      ref={containerRef}
      style={{
        ...style,
        height: virtualizer.getTotalSize(),
        position: "relative",
        width: "100%",
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = items[virtualItem.index] as T;
        const laneOffset = virtualItem.lane * gap;

        return (
          <div
            key={virtualItem.key}
            ref={virtualizer.measureElement}
            data-index={virtualItem.index}
            style={{
              left: 0,
              position: "absolute",
              top: 0,
              transform: `translate3d(calc(${virtualItem.lane * 100}% + ${laneOffset}px), ${virtualItem.start - scrollMargin}px, 0)`,
              width: `calc((100% - ${(columns - 1) * gap}px) / ${columns})`,
            }}
          >
            {render(item)}
          </div>
        );
      })}
    </div>
  );
}

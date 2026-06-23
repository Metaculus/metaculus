"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

type ListChartExpandedContextType = {
  setIsExpanded: (value: boolean) => void;
  hoveredChoiceName: string | null;
  setHoveredChoiceName: (name: string | null) => void;
  chartAreaHeight: number;
  cursorTimestamp: number | null;
  setCursorTimestamp: (ts: number | null) => void;
};

const ListChartExpandedContext = createContext<ListChartExpandedContextType>({
  setIsExpanded: () => {},
  hoveredChoiceName: null,
  setHoveredChoiceName: () => {},
  chartAreaHeight: 0,
  cursorTimestamp: null,
  setCursorTimestamp: () => {},
});

export const useListChartExpanded = () => useContext(ListChartExpandedContext);

type Props = {
  listContent: ReactNode;
  chartContent: ReactNode;
  stretchListContent?: boolean;
  hideListOnMobile?: boolean;
  hideDivider?: boolean;
  hideBorder?: boolean;
  reduceInnerPadding?: boolean;
  className?: string;
};

const ConsumerListChartShell: React.FC<Props> = ({
  listContent,
  chartContent,
  stretchListContent = false,
  hideListOnMobile = false,
  hideDivider = false,
  hideBorder = false,
  reduceInnerPadding = false,
  className,
}) => {
  const [isExpanded, setIsExpandedRaw] = useState(false);
  const [frozenHeight, setFrozenHeight] = useState(0);
  const [hoveredChoiceName, setHoveredChoiceName] = useState<string | null>(
    null
  );
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  const { ref: listColumnRef, height: listColumnHeight } =
    useContainerSize<HTMLDivElement>();

  // Keep a ref to the live height so the stable setIsExpanded callback can
  // snapshot it at click time without needing it as a dependency.
  const liveHeightRef = useRef(0);
  useLayoutEffect(() => {
    liveHeightRef.current = listColumnHeight;
  }, [listColumnHeight]);

  // Stable wrapper: snapshots the current height when expanding so the chart
  // area doesn't jump if a reflow occurs while the overlay is open.
  const setIsExpanded = useCallback((value: boolean) => {
    if (value) {
      setFrozenHeight(liveHeightRef.current);
    }
    setIsExpandedRaw(value);
  }, []);

  const effectiveHeight =
    isExpanded && frozenHeight > 0 ? frozenHeight : listColumnHeight;
  const chartAreaHeight = Math.max(0, effectiveHeight - 40);

  // Memoize so isExpanded changes don't re-render context consumers (e.g. the chart).
  const contextValue = useMemo(
    () => ({
      setIsExpanded,
      hoveredChoiceName,
      setHoveredChoiceName,
      chartAreaHeight,
      cursorTimestamp,
      setCursorTimestamp,
    }),
    [
      hoveredChoiceName,
      chartAreaHeight,
      setHoveredChoiceName,
      setIsExpanded,
      cursorTimestamp,
      setCursorTimestamp,
    ]
  );

  return (
    <ListChartExpandedContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-stretch",
          !hideBorder &&
            "sm:rounded-lg sm:border sm:border-gray-400/40 dark:sm:border-gray-400-dark/40",
          stretchListContent && "sm:min-h-[192px]",
          className
        )}
        onMouseLeave={() => {
          setHoveredChoiceName(null);
          setCursorTimestamp(null);
        }}
      >
        <div
          ref={listColumnRef}
          className={cn(
            "order-1 sm:w-80 sm:shrink-0 lg:w-64 xl:w-80",
            !stretchListContent && "sm:self-start",
            reduceInnerPadding ? "sm:py-5 sm:pl-5" : "sm:p-5",
            hideListOnMobile ? "hidden sm:block" : "",
            stretchListContent && "sm:flex sm:flex-col"
          )}
        >
          {listContent}
        </div>
        <div
          className={cn(
            "relative order-2 hidden flex-1 overflow-visible sm:flex sm:flex-col",
            reduceInnerPadding ? "sm:py-5" : "sm:p-5",
            !hideDivider &&
              "sm:before:absolute sm:before:bottom-0 sm:before:left-0 sm:before:w-px sm:before:bg-gray-400/40 sm:before:content-[''] dark:sm:before:bg-gray-400-dark/40",
            !hideDivider && (isExpanded ? "sm:before:top-2" : "sm:before:top-0")
          )}
          style={effectiveHeight > 0 ? { height: effectiveHeight } : undefined}
        >
          {chartContent}
        </div>
      </div>
    </ListChartExpandedContext.Provider>
  );
};

export default ConsumerListChartShell;

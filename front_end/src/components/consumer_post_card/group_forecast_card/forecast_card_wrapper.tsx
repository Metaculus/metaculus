import {
  faChevronDown,
  faChevronUp,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

type Props = {
  otherItemsCount: number;
  expanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  compact?: boolean;
  buttonVariant?: "primary" | "minimal";
  className?: string;
};

const ForecastCardWrapper: FC<PropsWithChildren<Props>> = ({
  otherItemsCount,
  expanded = false,
  onExpand,
  onCollapse,
  compact = false,
  buttonVariant = "primary",
  className,
  children,
}) => {
  const t = useTranslations();

  const isMinimal = buttonVariant === "minimal";

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(true);

  // 4px threshold avoids a permanently visible gradient on sub-pixel scroll remainders
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
  };

  // Hide the bottom gradient when the expanded list has nothing left to scroll
  useEffect(() => {
    if (!expanded) return;
    const el = scrollRef.current;
    if (!el) return;
    const frameId = window.requestAnimationFrame(checkScroll);
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      el.removeEventListener("scroll", checkScroll);
    };
  }, [expanded]);

  const toggleButtonClassName = cn(
    "flex w-full self-stretch items-center gap-2 rounded-lg px-[13px]",
    "font-medium leading-4",
    compact ? "h-6 md:h-8" : "h-8",
    isMinimal
      ? "border border-gray-300 text-xs text-gray-700 sm:text-sm dark:border-gray-300-dark dark:text-gray-700-dark"
      : "bg-blue-500/20 text-sm text-blue-700 dark:bg-blue-500-dark/20 dark:text-blue-700-dark"
  );

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        compact ? "gap-1 md:gap-2" : "gap-2",
        className
      )}
    >
      {expanded ? (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={scrollRef}
            className={cn(
              "flex flex-1 flex-col overflow-y-auto no-scrollbar",
              compact ? "gap-1 md:gap-2" : "gap-2"
            )}
          >
            {children}
          </div>
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-b from-transparent to-gray-0 transition-opacity dark:to-gray-0-dark",
              canScrollDown ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      ) : (
        children
      )}

      {expanded && onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          aria-pressed={true}
          className={cn(toggleButtonClassName, "shrink-0")}
        >
          <FontAwesomeIcon
            icon={isMinimal ? faEllipsis : faChevronUp}
            className={cn(
              isMinimal ? "h-3 w-3 opacity-[0.45] sm:h-4 sm:w-4" : "h-4 w-4"
            )}
          />
          {t("collapse")}
        </button>
      )}

      {otherItemsCount > 0 &&
        (isMinimal ? (
          <div
            className={cn(
              toggleButtonClassName,
              expanded && "pointer-events-none invisible"
            )}
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              className="h-3 w-3 opacity-[0.45] sm:h-4 sm:w-4"
            />
            {t("otherWithCount", { count: otherItemsCount })}
          </div>
        ) : (
          <button
            type="button"
            onClick={expanded ? undefined : onExpand}
            aria-pressed={false}
            className={cn(
              toggleButtonClassName,
              expanded && "pointer-events-none invisible"
            )}
            disabled={expanded}
          >
            <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
            {t("otherWithCount", { count: otherItemsCount })}
          </button>
        ))}
    </div>
  );
};

export default ForecastCardWrapper;

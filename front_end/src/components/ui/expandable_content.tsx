"use client";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

type Props = {
  maxCollapsedHeight?: number;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
  gradientClassName?: string;
  forceState?: boolean;
};

const ExpandableContent: FC<PropsWithChildren<Props>> = ({
  expandLabel: _expandLabel,
  collapseLabel: _collapseLabel,
  maxCollapsedHeight = 128,
  gradientClassName = "from-blue-200 dark:from-blue-200-dark",
  className,
  forceState,
  children,
}) => {
  const t = useTranslations();
  const expandLabel = _expandLabel ?? t("expand");
  const collapseLabel = _collapseLabel ?? t("collapse");

  const { ref, height, width } = useContainerSize<HTMLDivElement>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const contentHeight = element.scrollHeight;
    if (contentHeight <= maxCollapsedHeight) {
      setIsExpandable(false);
      setIsExpanded(true);
    } else {
      setIsExpandable(true);
      if (!userInteractedRef.current) {
        setIsExpanded(false);
      }
    }
  }, [maxCollapsedHeight, height, width, ref]);

  // Apply externally forced state and mark as user interaction so size effects won't override it.
  useEffect(() => {
    if (!isNil(forceState)) {
      userInteractedRef.current = true;
      setIsExpanded(forceState);
    }
  }, [forceState]);

  return (
    <div className={cn(gradientClassName, className)}>
      <div className="relative">
        <div
          ref={ref}
          className="m-0 flex flex-col overflow-hidden"
          style={{ maxHeight: isExpanded ? "" : maxCollapsedHeight }}
        >
          {children}
          <div
            className={cn(
              "pointer-events-none absolute bottom-0 block h-1/2 w-full bg-gradient-to-t to-transparent",
              { hidden: isExpanded }
            )}
          />
          <div
            className={cn(
              "flex w-full justify-center",
              isExpanded ? "mt-3" : "pointer-events-none absolute bottom-0",
              { hidden: !isExpandable }
            )}
          >
            <Button
              variant="tertiary"
              onClick={() => {
                userInteractedRef.current = true;
                setIsExpanded((prev) => !prev);
              }}
              className="pointer-events-auto"
            >
              <span className="inline-flex w-4 items-center justify-center">
                <FontAwesomeIcon
                  icon={isExpanded ? faChevronDown : faChevronRight}
                />
              </span>

              {isExpanded ? collapseLabel : expandLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(ExpandableContent), {
  ssr: false,
});

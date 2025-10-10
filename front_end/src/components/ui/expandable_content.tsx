"use client";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = {
  maxCollapsedHeight?: number;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
  gradientClassName?: string;
};

const ExpandableContent: FC<PropsWithChildren<Props>> = ({
  expandLabel: _expandLabel,
  collapseLabel: _collapseLabel,
  maxCollapsedHeight = 128,
  gradientClassName = "from-blue-200 dark:from-blue-200-dark",
  className,
  children,
}) => {
  const t = useTranslations();
  const expandLabel = _expandLabel ?? t("expand");
  const collapseLabel = _collapseLabel ?? t("collapse");

  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(true);

  useEffect(() => {
    if (ref.current && ref.current.scrollHeight <= maxCollapsedHeight) {
      setIsExpandable(false);
      setIsExpanded(true);
    }
  }, [maxCollapsedHeight]);

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
              onClick={() => setIsExpanded((prev) => !prev)}
              className="pointer-events-auto"
            >
              <FontAwesomeIcon
                icon={isExpanded ? faChevronUp : faChevronDown}
                className="ml-0.5 mr-1.5"
              />

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

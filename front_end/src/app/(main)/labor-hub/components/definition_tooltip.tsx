"use client";

import { Placement } from "@floating-ui/react";
import { ReactNode } from "react";

import Tooltip from "@/components/ui/tooltip";
import cn from "@/utils/core/cn";

type DefinitionTooltipProps = {
  children: ReactNode;
  tooltipContent: ReactNode;
  className?: string;
  tooltipClassName?: string;
  placement?: Placement;
  showDelayMs?: number;
};

export function DefinitionTooltip({
  children,
  tooltipContent,
  className,
  tooltipClassName,
  placement = "top",
  showDelayMs = 150,
}: DefinitionTooltipProps) {
  return (
    <Tooltip
      tooltipContent={tooltipContent}
      placement={placement}
      showDelayMs={showDelayMs}
      variant="light"
      tooltipClassName={tooltipClassName}
    >
      <span
        className={cn(
          "cursor-help border-b border-dashed border-current pb-px",
          className
        )}
      >
        {children}
      </span>
    </Tooltip>
  );
}

"use client";
import {
  autoUpdate,
  flip,
  limitShift,
  offset,
  Placement,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  FloatingPortal,
} from "@floating-ui/react";
import { FC, PropsWithChildren, ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

export type TooltipVariant = "dark" | "light";

const VARIANT_CLASS_NAMES: Record<TooltipVariant, string> = {
  dark: "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark",
  light:
    "border border-blue-400 bg-gray-0 text-gray-800 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-800-dark",
};

type Props = {
  tooltipContent: ReactNode;
  className?: string;
  tooltipClassName?: string;
  showDelayMs?: number;
  placement?: Placement;
  renderInPortal?: boolean;
  variant?: TooltipVariant;
};

const Tooltip: FC<PropsWithChildren<Props>> = ({
  tooltipContent,
  showDelayMs,
  placement,
  className,
  tooltipClassName,
  children,
  renderInPortal = true,
  variant = "dark",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip(),
      shift({ limiter: limitShift(), padding: 20 }),
    ],
  });
  const hover = useHover(context, {
    delay: { open: showDelayMs },
    handleClose: safePolygon(),
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const TooltipNode = (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "z-[200] w-max max-w-[300px] rounded-md px-4 py-3 text-base shadow-lg open:block sm:max-w-sm md:max-w-md",
        VARIANT_CLASS_NAMES[variant],
        tooltipClassName
      )}
      ref={refs.setFloating}
      style={floatingStyles}
      {...getFloatingProps()}
    >
      {tooltipContent}
    </div>
  );

  return (
    <div
      className={cn("relative inline-block", className)}
      tabIndex={0}
      ref={refs.setReference}
      {...getReferenceProps()}
    >
      {children}
      {isOpen &&
        (renderInPortal ? (
          <FloatingPortal>{TooltipNode}</FloatingPortal>
        ) : (
          TooltipNode
        ))}
    </div>
  );
};

export default Tooltip;

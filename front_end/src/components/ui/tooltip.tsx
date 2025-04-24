"use client";
import {
  autoUpdate,
  flip,
  FloatingPortal,
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
} from "@floating-ui/react";
import { FC, PropsWithChildren, ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

type Props = {
  tooltipContent: ReactNode;
  className?: string;
  tooltipClassName?: string;
  showDelayMs?: number;
  placement?: Placement;
};

const Tooltip: FC<PropsWithChildren<Props>> = ({
  tooltipContent,
  showDelayMs,
  placement,
  className,
  tooltipClassName,
  children,
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

  return (
    <>
      <div
        className={cn("inline-block", className)}
        tabIndex={0}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {children}
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            className={cn(
              "z-10 w-max max-w-[300px] rounded border bg-blue-900-dark p-2 text-sm open:block dark:border-gray-100 dark:bg-blue-900 dark:text-gray-100 sm:max-w-sm md:max-w-md",
              tooltipClassName
            )}
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {tooltipContent}
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default Tooltip;

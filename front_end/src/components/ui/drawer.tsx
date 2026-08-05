"use client";

import { Drawer } from "@base-ui/react/drawer";
import { FC, PropsWithChildren, useEffect, useState } from "react";

import cn from "@/utils/core/cn";

type Props = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  label?: string;
  className?: string;
}>;

/**
 * Bottom-sheet drawer for mobile flows, built on Base UI. Renders children
 * inside a swipe-down-dismissable sheet with a drag handle; header controls
 * (back/close) are the consumer's responsibility.
 */
const BottomDrawer: FC<Props> = ({
  open,
  onOpenChange,
  onOpenChangeComplete,
  label,
  className,
  children,
}) => {
  // Base UI skips the enter transition when the root mounts already open
  // (the global-modal registry mounts drawers on demand), so echo `open`
  // through state one tick later to always get the slide-up
  const [animatedOpen, setAnimatedOpen] = useState(false);
  useEffect(() => {
    setAnimatedOpen(open);
  }, [open]);

  return (
    <Drawer.Root
      open={animatedOpen}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={onOpenChangeComplete}
      swipeDirection="down"
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-[200] bg-blue-900/50 backdrop-blur-sm transition-opacity duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-gray-1000/50" />
        <Drawer.Viewport className="fixed inset-x-0 bottom-0 z-[201]">
          <Drawer.Popup
            className={cn(
              "rounded-t-2xl bg-gray-0 pb-8 pl-5 pr-5 pt-2 text-gray-900 shadow-xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:transition-none dark:bg-gray-0-dark dark:text-gray-900-dark",
              className
            )}
          >
            <Drawer.Content className="flex max-h-[calc(100dvh-8rem)] min-h-0 flex-col overflow-y-auto overscroll-contain">
              {label && (
                <Drawer.Title className="sr-only">{label}</Drawer.Title>
              )}
              <div className="flex justify-center pb-2.5 pt-1">
                <div className="h-1 w-9 rounded-full bg-gray-400 dark:bg-gray-400-dark" />
              </div>
              {children}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default BottomDrawer;

"use client";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from "@floating-ui/react";
import React from "react";

import cn from "@/utils/core/cn";

import { useTournamentsSection } from "../tournaments_provider";
import TournamentsInfo from "./tournaments_info";
import TournamentsInfoButton from "./tournaments_info_button";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  disabled?: boolean;
  offsetPx?: number;
  stickyTopPx?: number;
};

const TournamentsInfoPopover: React.FC<Props> = ({
  open,
  onOpenChange,
  disabled,
  offsetPx = 12,
  stickyTopPx = 0,
}) => {
  const { current } = useTournamentsSection();
  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange,
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(({ rects }) => {
        const header = document.getElementById("tournamentsStickyHeader");
        if (!header) return offsetPx;

        const headerBottom = header.getBoundingClientRect().bottom;

        const referenceBottom = rects.reference.y + rects.reference.height;
        const needed = headerBottom + offsetPx - referenceBottom;
        return Math.max(offsetPx, needed);
      }),
      flip({ padding: 12 }),
      shift({
        padding: {
          top: stickyTopPx + 8,
          left: 12,
          right: 12,
          bottom: 12,
        },
      }),
    ],
  });

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context, { outsidePress: false });
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  if (current !== "live") {
    return null;
  }

  return (
    <>
      <TournamentsInfoButton
        isOpen={open}
        refs={refs}
        getReferenceProps={getReferenceProps}
        disabled={disabled}
      />

      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              visibility: isPositioned ? "visible" : "hidden",
            }}
            className={cn("z-[60] w-[365px]")}
          >
            <TournamentsInfo
              onClose={() => {
                onOpenChange(false);
              }}
            />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};

export default TournamentsInfoPopover;

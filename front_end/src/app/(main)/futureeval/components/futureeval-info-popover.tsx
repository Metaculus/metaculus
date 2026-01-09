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
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS } from "../theme";

type Props = {
  defaultOpen?: boolean;
};

const FutureEvalInfoPopover: React.FC<Props> = ({ defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  const { refs, floatingStyles, context, isPositioned } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(12),
      flip({ padding: 12 }),
      shift({
        padding: {
          top: 60, // Account for navbar
          left: 12,
          right: 12,
          bottom: 12,
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { outsidePress: true });
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      {/* Info button - ensure square aspect ratio */}
      <Button
        ref={refs.setReference}
        presentationType="icon"
        size="md"
        variant={open ? "primary" : "tertiary"}
        aria-label="Learn more about the Model Leaderboard"
        aria-pressed={open}
        className={cn(
          "h-9 min-h-9 w-9 min-w-9 flex-shrink-0 text-lg",
          FE_COLORS.buttonBorder
        )}
        {...getReferenceProps()}
      >
        ?
      </Button>

      {/* Popover content */}
      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              visibility: isPositioned ? "visible" : "hidden",
            }}
            className={cn("z-[60] w-[340px] sm:w-[390px]")}
          >
            <div
              className={cn("relative rounded-[6px] p-5", FE_COLORS.tooltipBg)}
            >
              <p className={cn("my-0 text-sm", FE_COLORS.tooltipTextSecondary)}>
                We run all major models with a simple prompt on most open
                Metaculus forecasting questions, and collect their forecasts. As
                questions resolve, we score the models&apos; forecasts and
                continuously update our leaderboard to rank them against each
                other.
              </p>

              <p
                className={cn(
                  "mb-0 mt-2.5 text-sm",
                  FE_COLORS.tooltipTextSecondary
                )}
              >
                Since we measure against real world events, it takes time for
                new models to populate the leaderboard.
              </p>

              <div
                className={cn(
                  "mt-3 flex flex-wrap gap-2.5 text-xs font-medium",
                  FE_COLORS.tooltipLink
                )}
              >
                <Link
                  className="no-underline hover:underline"
                  href="/notebooks/38928/futureeval-resources-page/#what-is-the-model-leaderboard"
                >
                  Learn more here.
                </Link>
              </div>

              <Button
                presentationType="icon"
                size="sm"
                variant="text"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className={cn(
                  "absolute right-2.5 top-2.5 text-lg opacity-50",
                  FE_COLORS.tooltipText
                )}
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default FutureEvalInfoPopover;

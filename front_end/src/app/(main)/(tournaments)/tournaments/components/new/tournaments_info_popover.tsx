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
import { useTranslations } from "next-intl";
import React from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

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
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const isLoggedOut = !user;

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

  const handleSignup = () => setCurrentModal({ type: "signup", data: {} });

  return (
    <>
      <Button
        ref={refs.setReference}
        presentationType="icon"
        size="md"
        variant={open ? "primary" : "tertiary"}
        aria-label={t("tournamentsInfoAria")}
        aria-pressed={open}
        disabled={disabled}
        className="h-9 w-9 border-[1px] border-blue-400 text-lg dark:border-blue-400-dark"
        {...getReferenceProps()}
      >
        ?
      </Button>

      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...floatingStyles,
              visibility: isPositioned ? "visible" : "hidden",
            }}
            className={cn(
              "relative z-[60] w-[365px] rounded-[6px] bg-blue-400 p-5 dark:bg-blue-400-dark"
            )}
          >
            <h6 className="my-0 text-base font-medium text-blue-900 dark:text-blue-900-dark">
              {t("tournamentsInfoTitle")}
            </h6>

            <div className="mt-2.5 flex flex-wrap gap-2.5 text-xs font-medium text-blue-900 dark:text-blue-900-dark">
              <Link
                className="no-underline hover:underline"
                href="/help/scoring"
              >
                {t("tournamentsInfoScoringLink")}
              </Link>
              <Link
                className="no-underline hover:underline"
                href="/help/prizes"
              >
                {t("tournamentsInfoPrizesLink")}
              </Link>
            </div>

            {isLoggedOut && (
              <Button
                size="xs"
                onClick={handleSignup}
                className="mt-2.5 h-5 bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
              >
                {t("tournamentsInfoCta")}
              </Button>
            )}

            <Button
              presentationType="icon"
              size="sm"
              variant="text"
              aria-label={t("close")}
              onClick={() => onOpenChange(false)}
              className="absolute right-2.5 top-2.5 text-lg text-blue-900 opacity-50 dark:text-blue-900-dark dark:opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} />
            </Button>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
};

export default TournamentsInfoPopover;

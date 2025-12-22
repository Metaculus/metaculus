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
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  disabled?: boolean;
};

const PINNED_TOP = 72;
const STABLE_FRAMES_REQUIRED = 2;
const MAX_STABILIZE_FRAMES = 20;

type RectSnapshot = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

const TournamentsInfoPopover: React.FC<Props> = ({
  open,
  onOpenChange,
  disabled,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  const { user } = useAuth();
  const isLoggedOut = !user;

  const [referenceNode, setReferenceNode] = useState<HTMLElement | null>(null);
  const { refs, floatingStyles, context, update, isPositioned } = useFloating({
    open,
    onOpenChange,
    placement: "bottom-end",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 12 })],
  });

  const setReference = useCallback(
    (node: HTMLElement | null) => {
      refs.setReference(node);
      setReferenceNode(node);
    },
    [refs]
  );

  const [ready, setReady] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pinnedRight, setPinnedRight] = useState(0);

  // wait until the reference element's rect stabilizes before showing.
  useLayoutEffect(() => {
    if (!open || !referenceNode) {
      setReady(false);
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let last: RectSnapshot | null = null;
    let stableCount = 0;
    let frames = 0;

    const measure = () => {
      if (cancelled) return;

      const r = referenceNode.getBoundingClientRect();
      const next: RectSnapshot = {
        top: r.top,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };

      if (last && rectCloseEnough(last, next)) stableCount += 1;
      else stableCount = 0;

      last = next;
      frames += 1;

      if (
        stableCount >= STABLE_FRAMES_REQUIRED - 1 ||
        frames >= MAX_STABILIZE_FRAMES
      ) {
        recomputePinned(referenceNode, setPinned, setPinnedRight);
        update();

        rafId = requestAnimationFrame(() => {
          if (cancelled) return;
          update();
          setReady(true);
        });

        return;
      }

      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [open, referenceNode, update]);

  // keep pin state/right offset in sync on scroll/resize.
  useEffect(() => {
    if (!open || !referenceNode) return;

    const handler = () =>
      recomputePinned(referenceNode, setPinned, setPinnedRight);

    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });

    return () => {
      window.removeEventListener("scroll", handler);
      window.removeEventListener("resize", handler);
    };
  }, [open, referenceNode]);

  const click = useClick(context, { enabled: !disabled });
  const dismiss = useDismiss(context, { outsidePress: false });
  const role = useRole(context, { role: "dialog" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const pinnedStyles: React.CSSProperties = pinned
    ? {
        position: "fixed",
        top: PINNED_TOP,
        right: pinnedRight,
        left: "auto",
        bottom: "auto",
        transform: "none",
      }
    : {};

  const handleSignup = () => {
    setCurrentModal({ type: "signup", data: {} });
  };

  return (
    <>
      <Button
        ref={setReference}
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

      {open && referenceNode && ready ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{
              ...(pinned ? pinnedStyles : floatingStyles),
              visibility: isPositioned || pinned ? "visible" : "hidden",
            }}
            className={cn(
              "relative z-50 w-[365px] rounded-[6px] bg-blue-400 p-5",
              "dark:bg-blue-400-dark"
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

function rectCloseEnough(a: RectSnapshot, b: RectSnapshot) {
  const eps = 0.5;
  return (
    Math.abs(a.top - b.top) < eps &&
    Math.abs(a.left - b.left) < eps &&
    Math.abs(a.right - b.right) < eps &&
    Math.abs(a.bottom - b.bottom) < eps &&
    Math.abs(a.width - b.width) < eps &&
    Math.abs(a.height - b.height) < eps
  );
}

function isElementVisible(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return (
    r.bottom > 0 &&
    r.top < window.innerHeight &&
    r.right > 0 &&
    r.left < window.innerWidth
  );
}

function recomputePinned(
  referenceNode: HTMLElement,
  setPinned: React.Dispatch<React.SetStateAction<boolean>>,
  setPinnedRight: React.Dispatch<React.SetStateAction<number>>
) {
  const nextPinned = !isElementVisible(referenceNode);
  setPinned(nextPinned);

  if (nextPinned) {
    setPinnedRight(getPinnedRightOffset("tournamentsContainer"));
  }
}

function getPinnedRightOffset(containerId: string) {
  const el = document.getElementById(containerId);
  if (!el) return 0;

  const rect = el.getBoundingClientRect();
  const styles = window.getComputedStyle(el);
  const paddingRight = parseFloat(styles.paddingRight || "0");
  const innerRight = rect.right - paddingRight;

  return Math.max(0, window.innerWidth - innerRight);
}

export default TournamentsInfoPopover;

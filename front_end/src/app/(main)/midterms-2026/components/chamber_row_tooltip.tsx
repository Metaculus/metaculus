"use client";

import { useTranslations } from "next-intl";
import {
  FC,
  MouseEvent as RMouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import cn from "@/utils/core/cn";

type Props = {
  body: ReactNode;
  disclaimer: string;
  /** Question URL — tapping the tooltip body on mobile opens this in a new
   *  tab; on desktop the wrapped link handles the click directly. */
  href?: string;
  children: ReactNode;
};

/**
 * Wraps a Chamber Control row.
 *
 * Desktop (hover-capable): the tooltip appears via CSS on hover.
 * Touch devices: the row toggles the tooltip on tap. While open:
 *   - tapping the tooltip body opens the question
 *   - tapping the close button dismisses
 *   - tapping anywhere outside the row dismisses
 *
 * Exposes `group/cr` so descendants (e.g. the CvBars) can react to hover
 * via `group-hover/cr:*`, and `data-open` so they can also react to the
 * touch-tap state via `group-data-[open]/cr:*`.
 */
// Server snapshot: assume non-touch so the close button (mobile-only)
// is hidden during SSR and only appears after hydration on a touch device.
const subscribeHoverMQ = (callback: () => void) => {
  const mql = window.matchMedia("(hover: none)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
};
const getHoverNoneSnapshot = () => window.matchMedia("(hover: none)").matches;
const getHoverNoneServerSnapshot = () => false;

const ChamberRowTooltip: FC<Props> = ({ body, disclaimer, href, children }) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const isTouch = useSyncExternalStore(
    subscribeHoverMQ,
    getHoverNoneSnapshot,
    getHoverNoneServerSnapshot
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Outside-tap dismiss (mousedown to avoid racing the opener's click).
  useEffect(() => {
    if (!open) return;
    const handle = (e: globalThis.MouseEvent) => {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // First tap on a touch device opens the tooltip and swallows the click so
  // the wrapped link doesn't navigate. A subsequent tap anywhere in the
  // row (including the tooltip body) navigates via window.open.
  const handleWrapperClick = (e: RMouseEvent<HTMLDivElement>) => {
    if (!isTouch) return;
    if (!open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    }
  };

  const navigate = () => {
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleTooltipClick = (e: RMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    navigate();
  };

  return (
    <div
      ref={wrapperRef}
      className="group/cr relative"
      data-open={open || undefined}
      onClick={handleWrapperClick}
    >
      {children}
      <div
        role="tooltip"
        onClick={handleTooltipClick}
        className={cn(
          "absolute left-1/2 top-full z-20 mt-2 w-max max-w-[300px] -translate-x-1/2 flex-col items-center gap-1 rounded-md bg-blue-800 px-4 py-3 text-center text-base text-gray-0 shadow-lg dark:bg-blue-800-dark dark:text-gray-0-dark",
          open ? "flex cursor-pointer" : "hidden group-hover/cr:flex"
        )}
      >
        {open && isTouch && (
          <button
            type="button"
            aria-label={t("close")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center text-base leading-none text-gray-0 hover:opacity-80 dark:text-gray-0-dark"
          >
            ×
          </button>
        )}
        <span>{body}</span>
        <span className="text-xs text-blue-400 dark:text-blue-700">
          {disclaimer}
        </span>
      </div>
    </div>
  );
};

export default ChamberRowTooltip;

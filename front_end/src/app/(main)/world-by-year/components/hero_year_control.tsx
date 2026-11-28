"use client";

import { useTranslations } from "next-intl";
import {
  FC,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import cn from "@/utils/core/cn";

import { ArrowIcon } from "./icons";
import { WORLD_BY_YEAR_THEME_CLASSNAME } from "./theme";
import {
  SETTLE_AFTER_ARROW_MS,
  SETTLE_AFTER_KEY_MS,
} from "./world_year_provider";
import {
  YEAR_JUMPS,
  YEAR_MAX,
  YEAR_MIN,
  YEAR_STEP_KEYS,
} from "../helpers/forecast";

const DRAG_START_PX = 6;
const DRAG_CANCEL_PX = 10;
const PX_PER_YEAR = 16;
const POPOVER_GAP = 10;
const VIEWPORT_MARGIN = 8;

const arrowClassName =
  "inline-grid h-[max(30px,.62em)] w-[max(22px,.4em)] place-items-center rounded-lg text-current opacity-[.42] transition-[opacity,background-color] duration-150";

const arrowIconClassName = "size-[max(13px,.3em)]";

type DragState = {
  x: number;
  y: number;
  from: number;
  pointerId: number;
  moved: boolean;
  cancelled: boolean;
};

type Props = {
  year: number;
  scrubbing: boolean;
  onYearChange: (year: number, settleAfterMs?: number) => void;
  onScrubChange: (scrubbing: boolean) => void;
  hideArrowsOnPhones?: boolean;
  // Without the year list a press does nothing and the arrows stop at the
  // ends of the range; the Dive deeper view uses this for its own year.
  withList?: boolean;
  ariaLabel?: string;
};

const valueClassName = (scrubbing: boolean) =>
  cn(
    "relative rounded-[.12em] tabular-nums outline-none",
    "bg-[linear-gradient(currentColor,currentColor)] bg-[length:0_2px] bg-[position:0_94%] bg-no-repeat transition-[background-size] duration-200",
    scrubbing &&
      "!bg-[length:100%_1px] !bg-[repeating-linear-gradient(90deg,currentColor_0_3px,transparent_3px_6px)]"
  );

const rootClassName =
  "relative z-[1] inline-flex items-center gap-[.04em] whitespace-nowrap align-baseline text-[var(--wby-year)]";

// An inert, invisible twin that keeps the frosted copy of the headline the
// same size as the real one.
export const HeroYearControlTwin: FC<{ year: number }> = ({ year }) => (
  <span aria-hidden className={cn(rootClassName, "invisible")}>
    <span className={valueClassName(false)}>{year}</span>
    <span className="ml-[.06em] inline-flex translate-y-[.04em] items-center">
      <i className={arrowClassName}>
        <ArrowIcon direction="left" className={arrowIconClassName} />
      </i>
      <i className={arrowClassName}>
        <ArrowIcon direction="right" className={arrowIconClassName} />
      </i>
    </span>
  </span>
);

const HeroYearControl: FC<Props> = ({
  year,
  scrubbing,
  onYearChange,
  onScrubChange,
  hideArrowsOnPhones = false,
  withList = true,
  ariaLabel,
}) => {
  const t = useTranslations();
  const valueRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) valueRef.current?.focus({ preventScroll: true });
  };

  useLayoutEffect(() => {
    const el = popoverRef.current;
    const anchor = valueRef.current;
    if (!open || !el || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(
        window.innerWidth - el.offsetWidth - VIEWPORT_MARGIN,
        rect.left + rect.width / 2 - el.offsetWidth / 2
      )
    );
    const below = rect.bottom + POPOVER_GAP;
    const top =
      below + el.offsetHeight > window.innerHeight - VIEWPORT_MARGIN
        ? Math.max(VIEWPORT_MARGIN, rect.top - POPOVER_GAP - el.offsetHeight)
        : below;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = "visible";
    (
      el.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      el.querySelector<HTMLButtonElement>("button")
    )?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        valueRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      valueRef.current?.focus({ preventScroll: true });
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  // Sideways drags change the year; a mostly vertical move is left to the page
  // scroll, and a press without movement toggles the year list.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.cancelled) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dy) > DRAG_CANCEL_PX && Math.abs(dy) > Math.abs(dx)) {
          drag.cancelled = true;
          return;
        }
        if (Math.abs(dx) > DRAG_START_PX) {
          drag.moved = true;
          setOpen(false);
          setDragging(true);
          onScrubChange(true);
          try {
            valueRef.current?.setPointerCapture(drag.pointerId);
          } catch {}
        }
      }
      if (drag.moved) {
        event.preventDefault();
        onYearChange(drag.from + Math.round(dx / PX_PER_YEAR));
      }
    };
    const onUp = () => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      if (drag.moved) {
        suppressClickRef.current = true;
        setDragging(false);
        onScrubChange(false);
      } else if (drag.cancelled) {
        suppressClickRef.current = true;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onYearChange, onScrubChange, withList]);

  const onPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button) return;
    suppressClickRef.current = false;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      from: year,
      pointerId: event.pointerId,
      moved: false,
      cancelled: false,
    };
    if (event.pointerType === "mouse") event.preventDefault();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const step = YEAR_STEP_KEYS[event.key];
    if (step != null) {
      event.preventDefault();
      onYearChange(year + step, SETTLE_AFTER_KEY_MS);
    } else if (withList && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      valueRef.current?.click();
    }
  };

  const valueRole = withList
    ? {
        role: "button",
        "aria-haspopup": "listbox" as const,
        "aria-expanded": open,
      }
    : {
        role: "slider",
        "aria-valuemin": YEAR_MIN,
        "aria-valuemax": YEAR_MAX,
        "aria-valuenow": year,
      };

  return (
    <span className={rootClassName}>
      <span
        ref={valueRef}
        {...valueRole}
        tabIndex={0}
        aria-label={ariaLabel ?? t("worldByYearYearControlLabel")}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        onClick={(event) => {
          if (!withList) return;
          if (suppressClickRef.current && event.detail > 0) {
            suppressClickRef.current = false;
            return;
          }
          suppressClickRef.current = false;
          setOpen((value) => !value);
        }}
        className={cn(
          valueClassName(scrubbing),
          "group/year cursor-ew-resize touch-pan-y select-none hover:bg-[length:100%_1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--wby-year)]",
          dragging && "bg-[length:100%_1px]"
        )}
      >
        {year}
        <span
          hidden={!withList}
          className={cn(
            "pointer-events-none absolute left-1/2 top-[calc(100%+.3em)] z-[5] -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded-full bg-[rgba(var(--wby-ink),.12)] px-[9px] py-[5px] font-sans text-[11px] font-medium leading-none tracking-[.02em] text-[var(--wby-fg)] opacity-0 backdrop-blur-[10px] transition-[opacity,transform] delay-[250ms] duration-200 max-[720px]:hidden",
            "[@media(hover:hover)_and_(pointer:fine)]:group-hover/year:translate-y-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/year:opacity-100",
            dragging && "!opacity-0"
          )}
        >
          {t("worldByYearDragHint")}
        </span>
      </span>
      <span
        className={cn(
          "ml-[.06em] inline-flex translate-y-[.04em] items-center",
          hideArrowsOnPhones && "max-[720px]:hidden"
        )}
      >
        {([-1, 1] as const).map((delta) => (
          <button
            key={delta}
            type="button"
            aria-label={t(
              delta < 0 ? "worldByYearPreviousYear" : "worldByYearNextYear"
            )}
            disabled={
              !withList && (delta < 0 ? year <= YEAR_MIN : year >= YEAR_MAX)
            }
            onClick={() => onYearChange(year + delta, SETTLE_AFTER_ARROW_MS)}
            className={cn(
              arrowClassName,
              "cursor-pointer hover:bg-[rgba(var(--wby-ink),.08)] hover:opacity-100 focus-visible:bg-[rgba(var(--wby-ink),.08)] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--wby-year)] active:scale-[.92] disabled:pointer-events-none disabled:opacity-[.15]"
            )}
          >
            <ArrowIcon
              direction={delta < 0 ? "left" : "right"}
              className={arrowIconClassName}
            />
          </button>
        ))}
      </span>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={cn(
              WORLD_BY_YEAR_THEME_CLASSNAME,
              "invisible fixed z-[60] w-[264px] animate-[wby-drop-in_.14s_cubic-bezier(.23,1,.32,1)] rounded-2xl border border-[var(--wby-line2)] bg-[var(--wby-card)] p-3 font-sans shadow-[0_18px_44px_var(--wby-pop-shadow)] motion-reduce:animate-none"
            )}
          >
            <p className="mx-0.5 mb-2 mt-0 font-sans text-[11px] tracking-[.01em] text-[var(--wby-muted)]">
              {t("worldByYearYearListHeading", { year: String(year) })}
            </p>
            <div
              role="listbox"
              aria-label={t("worldByYearYear")}
              className="grid grid-cols-3 gap-1.5"
            >
              {YEAR_JUMPS.map((option) => {
                const selected = option === year;
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onYearChange(option);
                      close(true);
                    }}
                    className={cn(
                      "cursor-pointer rounded-[10px] border border-[var(--wby-line)] py-2.5 text-center font-sans text-[15px] font-medium tabular-nums text-[var(--wby-fg)] outline-none transition-colors duration-150 hover:bg-[rgba(var(--wby-ink),.07)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--wby-year)]",
                      selected &&
                        "border-[var(--wby-fg)] bg-[var(--wby-fg)] text-[var(--wby-bg)] hover:bg-[var(--wby-fg)]"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            <p className="mx-0.5 mb-0 mt-2.5 text-[12px] leading-[1.45] text-[var(--wby-t2)]">
              {t("worldByYearYearListNote")}
            </p>
          </div>,
          document.body
        )}
    </span>
  );
};

export default HeroYearControl;

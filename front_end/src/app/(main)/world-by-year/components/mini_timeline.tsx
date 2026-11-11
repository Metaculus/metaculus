"use client";

import { useTranslations } from "next-intl";
import {
  FC,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import { YEAR_STEP_KEYS } from "./hero_year_control";
import {
  SETTLE_AFTER_EDGE_KEY_MS,
  SETTLE_AFTER_KEY_MS,
} from "./world_year_provider";
import { clampYear, YEAR_MAX, YEAR_MIN } from "../helpers/forecast";
import { ARRIVALS_BY_YEAR, YEARS } from "../helpers/top_bar";

const DRAG_START_PX = 6;
const TAP_SLOP_PX = 12;

type DragState = {
  x: number;
  y: number;
  pointerId: number;
  touch: boolean;
  moved: boolean;
};

type Props = {
  year: number;
  onYearChange: (year: number, settleAfterMs?: number) => void;
  onScrubChange: (scrubbing: boolean) => void;
};

const yearAt = (event: ReactPointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return clampYear(
    YEAR_MIN +
      Math.floor(((event.clientX - rect.left) / rect.width) * YEARS.length)
  );
};

const MiniTimeline: FC<Props> = ({ year, onYearChange, onScrubChange }) => {
  const t = useTranslations();
  const [hover, setHover] = useState<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button) return;
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      touch: event.pointerType !== "mouse",
      moved: false,
    };
    if (event.pointerType === "mouse") event.preventDefault();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (
        !drag.moved &&
        Math.abs(dx) > DRAG_START_PX &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        drag.moved = true;
        try {
          event.currentTarget.setPointerCapture(drag.pointerId);
        } catch {}
        onScrubChange(true);
      }
      if (drag.moved) {
        setHover(null);
        onYearChange(yearAt(event));
        return;
      }
    }
    if (event.pointerType === "mouse") setHover(yearAt(event));
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.moved) {
      onScrubChange(false);
      return;
    }
    if (
      event.type === "pointerup" &&
      Math.abs(event.clientX - drag.x) < TAP_SLOP_PX &&
      Math.abs(event.clientY - drag.y) < TAP_SLOP_PX
    ) {
      if (drag.touch) setHover(null);
      onYearChange(yearAt(event));
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = YEAR_STEP_KEYS[event.key];
    if (step != null) {
      event.preventDefault();
      onYearChange(year + step, SETTLE_AFTER_KEY_MS);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      onYearChange(
        event.key === "Home" ? YEAR_MIN : YEAR_MAX,
        SETTLE_AFTER_EDGE_KEY_MS
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      onYearChange(year);
    }
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={t("worldByYearYear")}
      aria-valuemin={YEAR_MIN}
      aria-valuemax={YEAR_MAX}
      aria-valuenow={year}
      aria-valuetext={t("worldByYearMiniTimelineValue", {
        year: String(year),
        count: ARRIVALS_BY_YEAR.get(year) ?? 0,
      })}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={(event) => {
        if (!dragRef.current && event.pointerType === "mouse") setHover(null);
      }}
      onKeyDown={onKeyDown}
      className="relative touch-pan-y select-none rounded-[10px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--wby-year)]"
    >
      <div
        className="relative grid gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${YEARS.length}, minmax(0, 1fr))`,
        }}
      >
        {YEARS.map((option) => {
          const selected = option === year;
          const labelled =
            (option % 5 === 0 || option === YEAR_MIN) &&
            Math.abs(option - year) > 1;
          return (
            <div
              key={option}
              className={cn(
                "relative grid grid-rows-[14px_12px] justify-items-center rounded-md pb-[3px] pt-1 transition-colors duration-[120ms]",
                option === hover &&
                  !selected &&
                  "bg-[rgba(var(--wby-ink),.07)]",
                selected &&
                  "z-[1] -mx-[9px] rounded-[7px] bg-[rgba(var(--wby-ink),.1)] px-[9px] shadow-[inset_0_0_0_1px_rgba(var(--wby-ink),.38)]"
              )}
            >
              <i
                className={cn(
                  "h-2.5 w-0.5 self-center rounded-[1px] bg-[var(--wby-line2)]",
                  ARRIVALS_BY_YEAR.has(option) &&
                    "h-3 bg-[rgba(var(--wby-ink),.55)]",
                  selected && "w-[3px] bg-[var(--wby-year)]"
                )}
              />
              <span
                className={cn(
                  "relative z-[1] self-center text-[11px] tabular-nums leading-none text-[var(--wby-dim)]",
                  labelled && "text-[var(--wby-t2)]",
                  selected && "px-0.5 font-semibold text-[var(--wby-year)]"
                )}
              >
                {labelled || selected ? option : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniTimeline;

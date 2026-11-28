"use client";

import { useTranslations } from "next-intl";
import { CSSProperties, FC, Ref } from "react";

import cn from "@/utils/core/cn";

import { AreaIcon, CaretIcon } from "./icons";
import { GLASS_CARD_CLASSNAME, KIND_COLOR } from "./theme";
import { AREA_TITLE_KEYS, WorldQuestion } from "../data/questions";

const pagerButtonClassName =
  "relative grid size-5 place-items-center rounded text-[var(--wby-t1)] before:absolute before:-inset-1.5 before:content-[''] hover:bg-[var(--wby-line)] disabled:pointer-events-none disabled:opacity-30";

type Props = {
  ref?: Ref<HTMLDivElement>;
  milestones: WorldQuestion[];
  activeIndex: number;
  below: boolean;
  stacked: boolean;
  hidden: boolean;
  style?: CSSProperties;
  formatDate: (median: number) => string;
  onPage: (delta: number) => void;
  onJump: (question: WorldQuestion) => void;
  onHoverChange: (hovered: boolean) => void;
};

const MilestoneCard: FC<Props> = ({
  ref,
  milestones,
  activeIndex,
  below,
  stacked,
  hidden,
  style,
  formatDate,
  onPage,
  onJump,
  onHoverChange,
}) => {
  const t = useTranslations();
  const solo = milestones.length < 2;

  return (
    <div
      ref={ref}
      inert={hidden}
      style={style}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") onHoverChange(true);
      }}
      onPointerLeave={() => onHoverChange(false)}
      className={cn(
        GLASS_CARD_CLASSNAME,
        "flex max-w-[262px] flex-col",
        stacked ? "relative flex-[0_0_262px] snap-start" : "absolute",
        "[transition:opacity_.5s_ease,transform_.5s_ease,left_.3s_ease,bottom_.3s_ease,top_.3s_ease]",
        hidden &&
          "pointer-events-none [transition:opacity_.35s_ease,transform_.35s_ease]",
        hidden && (below ? "-translate-y-2.5" : "translate-y-2.5"),
        hidden && stacked && "hidden"
      )}
    >
      <div className="absolute right-[9px] top-[9px] z-[2] flex items-center gap-[3px] font-sans text-[10px] text-[var(--wby-muted)]">
        <button
          type="button"
          aria-label={t("worldByYearPreviousMilestone")}
          disabled={solo}
          onClick={() => onPage(-1)}
          className={pagerButtonClassName}
        >
          <CaretIcon direction="left" className="size-3" />
        </button>
        <span>
          {activeIndex + 1}/{milestones.length}
        </span>
        <button
          type="button"
          aria-label={t("worldByYearNextMilestone")}
          disabled={solo}
          onClick={() => onPage(1)}
          className={pagerButtonClassName}
        >
          <CaretIcon direction="right" className="size-3" />
        </button>
      </div>
      <div className="relative z-[1] grid flex-1">
        {milestones.map((milestone, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={active ? `active-${milestone.id}` : milestone.id}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "flex flex-col [grid-area:1/1]",
                active
                  ? "animate-[wby-fade-up_.35s_ease_both] motion-reduce:animate-none"
                  : "invisible"
              )}
            >
              <div className="flex min-h-[22px] items-center gap-[7px] pr-[74px] font-sans text-[11px] font-medium leading-[1.3] tracking-[.01em] text-[var(--wby-t3)]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(var(--wby-ink),.12)] bg-[rgba(var(--wby-ink),.08)] py-[3px] pl-[7px] pr-[9px] text-[var(--wby-t1)]">
                  <AreaIcon area={milestone.area} className="size-[13px]" />
                  <span>{t(AREA_TITLE_KEYS[milestone.area])}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => onJump(milestone)}
                className="mt-4 cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-[15px] font-medium leading-[1.4] text-[var(--wby-fg)] [text-wrap:pretty] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)]"
              >
                {t(milestone.headlineKey)}
              </button>
              <div className="mt-auto flex flex-wrap justify-between gap-2 pt-2.5 font-sans text-[11px] text-[var(--wby-muted)]">
                <span style={{ color: KIND_COLOR[milestone.kind] }}>
                  {formatDate(milestone.median)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MilestoneCard;

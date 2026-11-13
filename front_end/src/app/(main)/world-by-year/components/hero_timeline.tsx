"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CSSProperties,
  FC,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

import { AreaIcon, LongArrowIcon } from "./icons";
import MilestoneCard from "./milestone_card";
import { GLASS_CARD_CLASSNAME, KIND_COLOR, STAGE_FADE_IMAGE } from "./theme";
import { useWorldData } from "./world_data_provider";
import {
  SETTLE_AFTER_EDGE_KEY_MS,
  SETTLE_AFTER_KEY_MS,
} from "./world_year_provider";
import { AREA_TITLE_KEYS, WorldQuestion } from "../data/questions";
import {
  clampYear,
  isDimmedIn,
  isLikelyByEndOf,
  medianDate,
  MilestoneGroup,
  timelinePosition,
  YEAR_LABELS,
  YEAR_MAX,
  YEAR_MIN,
  YEAR_STEP_KEYS,
  yearAtPosition,
  yearFillPosition,
} from "../helpers/forecast";
import {
  MOUSE_SCROLL_START_PX,
  percent,
  placeZone,
  Side,
  STACK_BELOW_PX,
  STEM_BASE,
  stemPath,
} from "../helpers/timeline_layout";

const PEEK_HIDE_DELAY_MS = 260;

type Peek = { id: string; left: number; arrow: number };

type Props = {
  year: number;
  playing: boolean;
  heroRef: RefObject<HTMLElement | null>;
  headRef: RefObject<HTMLElement | null>;
  onYearChange: (year: number, settleAfterMs?: number) => void;
  onScrubChange: (scrubbing: boolean) => void;
  onJump: (question: WorldQuestion) => void;
};

const HeroTimeline: FC<Props> = ({
  year,
  playing,
  heroRef,
  headRef,
  onYearChange,
  onScrubChange,
  onJump,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { questions, byId, milestoneGroups } = useWorldData();
  const { ref: trackRef, width: trackWidth } =
    useContainerSize<HTMLDivElement>();
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackDragRef = useRef(false);
  const trackRafRef = useRef<number | null>(null);
  const trackPointerXRef = useRef<number | null>(null);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const [activeIndexes, setActiveIndexes] = useState(() =>
    milestoneGroups.map(() => 0)
  );
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [metrics, setMetrics] = useState({ cardHeight: 0, step: 16 });
  const [grabbedZone, setGrabbedZone] = useState<Side | null>(null);

  const stacked = trackWidth === 0 || trackWidth < STACK_BELOW_PX;
  const measured = trackWidth > 0 && (stacked || metrics.cardHeight > 0);

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    return (median: number) => formatter.format(medianDate(median));
  }, [locale]);

  const currentMilestone = (index: number) => {
    const group = milestoneGroups[index] as MilestoneGroup;
    return group.milestones[activeIndexes[index] ?? 0] as WorldQuestion;
  };
  const isHidden = (index: number) =>
    year < Math.floor(currentMilestone(index).median);

  // Cards share the tallest card's height; later cards step further from the
  // line, by as much as the viewport height leaves room for.
  const measure = useCallback(() => {
    if (!trackWidth || trackWidth < STACK_BELOW_PX) return;
    const heights = cardRefs.current.map((el) => {
      if (!el) return 0;
      const minHeight = el.style.minHeight;
      el.style.minHeight = "";
      const height = el.offsetHeight;
      el.style.minHeight = minHeight;
      return height;
    });
    const cardHeight = Math.max(0, ...heights);
    const heroTop = heroRef.current
      ? heroRef.current.getBoundingClientRect().top + window.scrollY
      : 0;
    const used =
      (headRef.current?.offsetHeight ?? 0) + 60 + 2 * cardHeight + 92 + 40 + 52;
    const step = Math.max(
      16,
      Math.min(72, (window.innerHeight - heroTop - used) / 4)
    );
    setMetrics((prev) =>
      prev.cardHeight === cardHeight && prev.step === step
        ? prev
        : { cardHeight, step }
    );
  }, [trackWidth, heroRef, headRef]);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, locale]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const cardOpacity = (index: number) => {
    if (isHidden(index)) return 0;
    if (peek) return 0.15;
    if (hoveredGroup != null && hoveredGroup !== index) return 0.28;
    return isDimmedIn(year, currentMilestone(index)) ? 0.55 : 1;
  };

  const page = (index: number, delta: number) =>
    setActiveIndexes((prev) =>
      prev.map((value, i) => {
        if (i !== index) return value;
        const count = (milestoneGroups[i] as MilestoneGroup).milestones.length;
        return (value + delta + count) % count;
      })
    );

  const keepPeek = () => clearTimeout(peekTimerRef.current);
  const hidePeekLater = () => {
    keepPeek();
    peekTimerRef.current = setTimeout(() => setPeek(null), PEEK_HIDE_DELAY_MS);
  };
  const jump = (question: WorldQuestion) => {
    setPeek(null);
    onJump(question);
  };
  const showPeek = (id: string) => {
    const question = byId.get(id);
    if (!question || !trackWidth) return;
    const x = timelinePosition(question.median) * trackWidth;
    const width = Math.min(262, Math.max(190, window.innerWidth * 0.2));
    const left = Math.max(0, Math.min(trackWidth - width, x - width / 2));
    setPeek({ id, left, arrow: x - left });
  };

  useEffect(() => () => clearTimeout(peekTimerRef.current), []);

  useEffect(() => {
    if (!peek) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-question-tick],[data-question-peek]")) {
        setPeek(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [peek]);

  const yearFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return year;
    return yearAtPosition((clientX - rect.left) / rect.width);
  };

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest("[data-question-peek]")) return;
    trackDragRef.current = true;
    trackPointerXRef.current = event.clientX;
    onScrubChange(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}
    onYearChange(yearFromPointer(event.clientX));
  };
  const onTrackPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!trackDragRef.current) return;
    event.preventDefault();
    trackPointerXRef.current = event.clientX;
    if (trackRafRef.current != null) return;
    trackRafRef.current = requestAnimationFrame(() => {
      trackRafRef.current = null;
      const clientX = trackPointerXRef.current;
      if (trackDragRef.current && clientX != null) {
        onYearChange(yearFromPointer(clientX));
      }
    });
  };
  const onTrackPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!trackDragRef.current) return;
    if (trackRafRef.current != null) {
      cancelAnimationFrame(trackRafRef.current);
      trackRafRef.current = null;
    }
    const clientX =
      event.type === "pointerup" ? event.clientX : trackPointerXRef.current;
    trackPointerXRef.current = null;
    trackDragRef.current = false;
    if (clientX != null) onYearChange(yearFromPointer(clientX));
    onScrubChange(false);
  };
  const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
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
    } else if (event.key === "Enter" && questions.length) {
      event.preventDefault();
      const nearest = questions.reduce((best, question) =>
        Math.abs(question.median - (year + 0.5)) <
        Math.abs(best.median - (year + 0.5))
          ? question
          : best
      );
      showPeek(nearest.id);
    } else if (event.key === "Escape") {
      setPeek(null);
    }
  };

  // Mouse users can drag the stacked card rows sideways; touch already swipes.
  const zoneDragRef = useRef<{
    el: HTMLDivElement;
    side: Side;
    x: number;
    scroll: number;
    moved: boolean;
  } | null>(null);
  useEffect(() => {
    if (!stacked) return;
    const onMove = (event: PointerEvent) => {
      const drag = zoneDragRef.current;
      if (!drag) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > MOUSE_SCROLL_START_PX) {
        drag.moved = true;
        setGrabbedZone(drag.side);
      }
      if (drag.moved) {
        drag.el.scrollLeft = drag.scroll - dx;
        event.preventDefault();
      }
    };
    const onUp = () => {
      const drag = zoneDragRef.current;
      zoneDragRef.current = null;
      if (!drag?.moved) return;
      setGrabbedZone(null);
      const swallowClick = (event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
      };
      document.addEventListener("click", swallowClick, {
        capture: true,
        once: true,
      });
      setTimeout(
        () =>
          document.removeEventListener("click", swallowClick, {
            capture: true,
          }),
        0
      );
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [stacked]);

  const onZonePointerDown =
    (side: Side) => (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      if (
        !stacked ||
        event.pointerType !== "mouse" ||
        event.button ||
        (event.target as Element).closest("button,a") ||
        el.scrollWidth <= el.clientWidth + 2
      ) {
        return;
      }
      zoneDragRef.current = {
        el,
        side,
        x: event.clientX,
        scroll: el.scrollLeft,
        moved: false,
      };
    };

  const renderZone = (side: Side) => {
    const placed = placeZone(milestoneGroups, side, trackWidth, metrics.step);
    const below = side === "below";
    const zoneHeight =
      metrics.cardHeight + (placed[placed.length - 1]?.offset ?? 0);
    const base = STEM_BASE[side];

    return (
      <div
        onPointerDown={onZonePointerDown(side)}
        style={stacked ? undefined : { height: zoneHeight }}
        className={cn(
          "relative isolate z-[1]",
          stacked &&
            "-mx-[var(--wby-pad)] flex cursor-grab snap-x snap-proximity scroll-px-[var(--wby-pad)] gap-2.5 overflow-x-auto overscroll-x-contain px-[var(--wby-pad)] py-2.5 no-scrollbar [mask-image:linear-gradient(90deg,transparent,#000_var(--wby-pad),#000_calc(100%-var(--wby-pad)),transparent)] after:flex-[0_0_1px] after:content-['']",
          stacked &&
            grabbedZone === side &&
            "cursor-grabbing select-none snap-none"
        )}
      >
        {!stacked && (
          <span
            className={cn(
              "pointer-events-none absolute -left-[30px] hidden rotate-180 font-sans text-[11px] font-medium leading-none tracking-[.01em] [writing-mode:vertical-rl] min-[1301px]:block",
              below ? "top-0" : "bottom-0"
            )}
            style={{ color: KIND_COLOR[below ? "use" : "cap"] }}
          >
            {t(below ? "worldByYearAdoption" : "worldByYearCapability")}
          </span>
        )}
        {placed.map((card, i) => {
          const { group, index } = card;
          const milestone = currentMilestone(index);
          const hidden = isHidden(index);
          const hovered = hoveredGroup === index;
          const stemHeight = base + card.offset;
          const dot = timelinePosition(milestone.median) * trackWidth;
          return (
            <div key={index} className="contents">
              <MilestoneCard
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                milestones={group.milestones}
                activeIndex={activeIndexes[index] ?? 0}
                below={below}
                stacked={stacked}
                hidden={hidden}
                formatDate={formatDate}
                onPage={(delta) => page(index, delta)}
                onJump={jump}
                onHoverChange={(value) =>
                  setHoveredGroup((prev) =>
                    value ? index : prev === index ? null : prev
                  )
                }
                style={
                  stacked
                    ? { opacity: cardOpacity(index) }
                    : {
                        ...(below
                          ? { top: card.offset }
                          : { bottom: card.offset }),
                        left: card.left,
                        width: card.width,
                        minHeight: metrics.cardHeight || undefined,
                        zIndex: 20 - i,
                        opacity: cardOpacity(index),
                      }
                }
              />
              {!stacked && measured && (
                <svg
                  aria-hidden
                  width={card.width}
                  height={stemHeight}
                  viewBox={`0 0 ${card.width} ${stemHeight}`}
                  className="pointer-events-none absolute z-0 overflow-visible transition-opacity duration-200"
                  style={{
                    ...(below ? { top: -base } : { bottom: -base }),
                    left: card.left,
                    width: card.width,
                    height: stemHeight,
                    opacity: hidden ? 0 : peek ? 0.15 : 1,
                  }}
                >
                  <path
                    d={stemPath(
                      card.width,
                      stemHeight,
                      dot - card.left - card.width / 2,
                      side
                    )}
                    className={cn(
                      "fill-none stroke-[rgba(var(--wby-ink),.28)] stroke-1 [transition:stroke_.2s,stroke-width_.2s,opacity_.2s] [vector-effect:non-scaling-stroke]",
                      hovered &&
                        "stroke-[rgba(var(--wby-ink),.8)] stroke-[1.5]",
                      hoveredGroup != null && !hovered && "opacity-40"
                    )}
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const peekQuestion = peek ? byId.get(peek.id) : undefined;
  const fill = percent(yearFillPosition(year));
  const playTransition =
    playing && "[transition:left_1s_linear,width_1s_linear]";

  return (
    <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-[var(--wby-pad)] pb-9 pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[160px] bottom-0 left-1/2 z-0 w-screen -translate-x-1/2"
        style={{ backgroundImage: STAGE_FADE_IMAGE }}
      />
      <div
        className={cn("relative @container", !measured && "@[860px]:invisible")}
      >
        {renderZone("above")}
        <div className="relative z-[3] mt-[18px]">
          <div
            ref={trackRef}
            data-wby-track
            role="slider"
            tabIndex={0}
            aria-label={t("worldByYearHeroTrackLabel")}
            aria-valuemin={YEAR_MIN}
            aria-valuemax={YEAR_MAX}
            aria-valuenow={year}
            aria-valuetext={t("worldByYearSelectedYearValue", {
              year: String(year),
            })}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={onTrackPointerEnd}
            onPointerCancel={onTrackPointerEnd}
            onLostPointerCapture={onTrackPointerEnd}
            onKeyDown={onTrackKeyDown}
            className="relative z-[3] h-[52px] cursor-ew-resize touch-pan-y [@media(pointer:coarse)]:touch-none"
          >
            <div className="absolute inset-x-0 top-[24.5px] h-[3px] rounded-sm bg-[rgba(var(--wby-ink),.14)]" />
            <div
              className={cn(
                "absolute left-0 top-[24.5px] h-[3px] rounded-sm bg-[rgba(var(--wby-ink),.7)] will-change-[width]",
                playTransition
              )}
              style={{ width: fill }}
            />
            <div
              onPointerOver={(event) => {
                const tick = (event.target as Element).closest<HTMLElement>(
                  "[data-question-tick]"
                );
                if (!tick?.dataset.questionTick) return;
                keepPeek();
                showPeek(tick.dataset.questionTick);
              }}
              onPointerOut={(event) => {
                if (
                  event.pointerType === "mouse" &&
                  (event.target as Element).closest("[data-question-tick]")
                ) {
                  hidePeekLater();
                }
              }}
            >
              {questions.map((question) => {
                const lit = isLikelyByEndOf(year, question);
                const hot = peek?.id === question.id;
                return (
                  <div
                    key={question.id}
                    data-question-tick={question.id}
                    className={cn(
                      "absolute -ml-[5px] h-5 w-2.5",
                      question.kind === "cap" ? "top-0.5" : "top-[30px]"
                    )}
                    style={{ left: percent(timelinePosition(question.median)) }}
                  >
                    <i
                      className={cn(
                        "absolute left-1 h-[14px] w-0.5 rounded-[1px] bg-[rgba(var(--wby-ink),.3)] opacity-[.55] [transition:background_.35s_ease,height_.35s_ease,opacity_.35s_ease]",
                        question.kind === "cap" ? "bottom-0" : "top-0",
                        lit && "h-4 opacity-100",
                        hot && "left-[3px] h-[18px] w-1"
                      )}
                      style={
                        lit
                          ? { background: KIND_COLOR[question.kind] }
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
            {!stacked &&
              milestoneGroups.map((group, index) => {
                const milestone = currentMilestone(index);
                const hovered = hoveredGroup === index;
                return (
                  <i
                    key={index}
                    className={cn(
                      "absolute top-[24.5px] z-[5] -ml-[3.5px] -mt-0.5 size-[7px] rounded-full shadow-[0_0_0_2px_var(--wby-bg)] [transition:left_.3s_ease,opacity_.5s_ease,transform_.25s_ease,background_.3s_ease]",
                      hovered && "scale-150"
                    )}
                    style={{
                      left: percent(timelinePosition(milestone.median)),
                      background: KIND_COLOR[group.kind],
                      opacity: isHidden(index)
                        ? 0
                        : peek
                          ? 0.15
                          : hoveredGroup != null && !hovered
                            ? 0.3
                            : 1,
                    }}
                  />
                );
              })}
            <div
              className={cn(
                "absolute top-[17px] z-[6] -ml-[14px] h-[18px] w-7 rounded-full bg-[var(--wby-year)] will-change-[left]",
                "after:absolute after:inset-0 after:m-auto after:size-2.5 after:bg-[radial-gradient(circle,var(--wby-handle-dot)_0.7px,transparent_1px)] after:bg-[length:5px_3.5px] after:content-['']",
                playTransition
              )}
              style={{ left: fill }}
            />
          </div>
          {peek && peekQuestion && (
            <div
              data-question-peek
              onPointerEnter={keepPeek}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") hidePeekLater();
              }}
              style={
                {
                  left: peek.left,
                  "--wby-arrow": `${peek.arrow}px`,
                } as CSSProperties
              }
              className={cn(
                GLASS_CARD_CLASSNAME,
                "absolute bottom-full z-[6] mb-2 w-[clamp(190px,20vw,262px)] cursor-default",
                "after:absolute after:left-[var(--wby-arrow)] after:top-full after:h-2.5 after:w-px after:bg-[var(--wby-tick)] after:content-['']"
              )}
            >
              <div className="relative z-[1] flex min-h-[22px] items-center gap-[7px] font-sans text-[11px] font-medium leading-[1.3] tracking-[.01em] text-[var(--wby-t3)]">
                <AreaIcon
                  area={peekQuestion.area}
                  className="size-[15px] text-[var(--wby-t1)]"
                />
                <span>{t(AREA_TITLE_KEYS[peekQuestion.area])}</span>
              </div>
              <div className="relative z-[1] mt-4 font-sans text-[15px] font-medium leading-[1.4] text-[var(--wby-fg)] [text-wrap:pretty]">
                {t(peekQuestion.headlineKey)}
              </div>
              <div className="relative z-[1] pt-2.5 font-sans text-[11px] text-[var(--wby-muted)]">
                <span style={{ color: KIND_COLOR[peekQuestion.kind] }}>
                  {formatDate(peekQuestion.median)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => jump(peekQuestion)}
                className="relative z-[1] mt-2 flex w-full cursor-pointer items-center gap-1 border-0 border-t border-solid border-[var(--wby-line)] bg-transparent px-0 pb-0 pt-2 text-left font-sans text-[11px] font-medium text-[var(--wby-t1)] hover:text-[var(--wby-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)]"
              >
                {t("worldByYearGoToAreaInYear", {
                  area: t(AREA_TITLE_KEYS[peekQuestion.area]),
                  year: String(
                    peekQuestion.firstLikelyYear ??
                      clampYear(Math.floor(peekQuestion.median))
                  ),
                })}
                <LongArrowIcon direction="right" className="size-3" />
              </button>
            </div>
          )}
        </div>
        <div className="relative mb-[18px] mt-0.5 h-[14px] font-sans text-[11px] text-[var(--wby-muted)]">
          {YEAR_LABELS.map((label, i) => (
            <span
              key={label}
              className="absolute"
              style={{
                left: percent(timelinePosition(label)),
                transform: `translateX(${i === 0 ? "0" : i === YEAR_LABELS.length - 1 ? "-100%" : "-50%"})`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {renderZone("below")}
      </div>
    </div>
  );
};

export default HeroTimeline;

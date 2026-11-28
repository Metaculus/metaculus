"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import {
  createContext,
  FC,
  PointerEvent as ReactPointerEvent,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import DensityChart, { yearLineFraction } from "./density_chart";
import ForecastMeta from "./forecast_meta";
import HeroYearControl from "./hero_year_control";
import { CloseIcon, LongArrowIcon } from "./icons";
import KindChip from "./kind_chip";
import SectionTile from "./section_tile";
import { KIND_COLOR, WORLD_BY_YEAR_THEME_CLASSNAME } from "./theme";
import { useForecastDetailNavigation } from "./use_forecast_detail_navigation";
import { useWorldFormatters } from "./use_world_formatters";
import { useWorldData } from "./world_data_provider";
import { useWorldYear } from "./world_year_provider";
import { AREA_SECTIONS } from "../data/area_sections";
import { AREA_TITLE_KEYS, WorldArea, WorldQuestion } from "../data/questions";
import { statementsFor } from "../helpers/area_section";
import { quartileRange, yearAtChartFraction } from "../helpers/dive_deeper";
import { clampYear } from "../helpers/forecast";

// At and below this width the list docks under the forecast, three items tall.
const DOCKED_LIST_MAX_PX = 960;
const DOCKED_LIST_ITEMS = 3;
const DOCKED_LIST_GAP_PX = 8;
const DOCKED_LIST_EXTRA_PX = 12;
const LIST_DRAG_START_PX = 4;

export type DiveDeeperTarget = { area: WorldArea; questionId?: string };

const DiveDeeperContext = createContext<(target: DiveDeeperTarget) => void>(
  () => {}
);

export const useDiveDeeper = () => useContext(DiveDeeperContext);

const navClassName =
  "grid size-8 cursor-pointer place-items-center self-center justify-self-center rounded-full border border-[rgba(var(--wby-ink),.18)] bg-[rgba(var(--wby-ink),.06)] text-[var(--wby-fg)] outline-none transition-[background-color,transform] duration-200 hover:scale-[1.06] hover:bg-[rgba(var(--wby-ink),.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)] disabled:pointer-events-none disabled:opacity-25 max-[720px]:mx-4 max-[720px]:mb-3 max-[720px]:size-11";

// Keeps the active item in view; while the list is docked its heading is
// sticky, so the item has to clear it too.
const fitList = (list: HTMLElement) => {
  const docked = window.innerWidth <= DOCKED_LIST_MAX_PX;
  const items = Array.from(
    list.querySelectorAll<HTMLElement>("[data-deep-item]")
  );
  const heading = list.querySelector<HTMLElement>("[data-deep-heading]");
  const headingHeight = docked ? heading?.offsetHeight ?? 0 : 0;
  if (docked && items.length > DOCKED_LIST_ITEMS) {
    const visible = items
      .slice(0, DOCKED_LIST_ITEMS)
      .reduce((sum, item) => sum + item.offsetHeight, 0);
    list.style.maxHeight = `${
      visible +
      (DOCKED_LIST_ITEMS - 1) * DOCKED_LIST_GAP_PX +
      headingHeight +
      DOCKED_LIST_EXTRA_PX
    }px`;
  } else {
    list.style.maxHeight = "";
  }
  const active = list.querySelector<HTMLElement>('[aria-current="true"]');
  if (!active) return;
  const listRect = list.getBoundingClientRect();
  const rect = active.getBoundingClientRect();
  if (rect.top < listRect.top + headingHeight) {
    list.scrollTop += rect.top - listRect.top - headingHeight - 4;
  } else if (rect.bottom > listRect.bottom) {
    list.scrollTop += rect.bottom - listRect.bottom;
  }
};

type ViewProps = {
  area: WorldArea;
  questionId?: string;
  onClose: () => void;
};

const DiveDeeperView: FC<ViewProps> = ({ area, questionId, onClose }) => {
  const t = useTranslations();
  const { year: pageYear } = useWorldYear();
  const { formatDate } = useWorldFormatters();
  const { questions: allQuestions } = useWorldData();
  const questions = useMemo(
    () => statementsFor(allQuestions, area),
    [allQuestions, area]
  );
  const { index, direction, step, select, stageRef, cardRef, onKeyDown } =
    useForecastDetailNavigation({
      count: questions.length,
      initialIndex: Math.max(
        0,
        questions.findIndex((question) => question.id === questionId)
      ),
      ignoreSwipeSelector: "[data-deep-drag]",
    });
  const [year, setYear] = useState(pageYear);
  const [grabbing, setGrabbing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartDragRef = useRef(false);

  const question = questions[index] as WorldQuestion;
  const copy = AREA_SECTIONS[area].questions;
  const questionTitle = (q: WorldQuestion) => {
    const titleKey = copy[q.id]?.titleKey;
    return titleKey ? t(titleKey) : "";
  };

  const changeYear = useCallback(
    (next: number) => setYear(clampYear(next)),
    []
  );
  const ignoreScrub = useCallback(() => {}, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const fit = () => fitList(list);
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [index]);

  // The mouse can drag the list like a touch scroll; the click that ends a
  // drag is swallowed so it does not pick an item.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let drag: { y: number; scrollTop: number; moved: boolean } | null = null;
    const swallowClick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
    };
    const onDown = (event: PointerEvent) => {
      if (
        event.pointerType !== "mouse" ||
        event.button ||
        list.scrollHeight <= list.clientHeight + 2
      ) {
        return;
      }
      drag = { y: event.clientY, scrollTop: list.scrollTop, moved: false };
    };
    const onMove = (event: PointerEvent) => {
      if (!drag) return;
      const dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dy) > LIST_DRAG_START_PX) {
        drag.moved = true;
        setGrabbing(true);
      }
      if (drag.moved) {
        list.scrollTop = drag.scrollTop - dy;
        event.preventDefault();
      }
    };
    const onUp = () => {
      if (!drag) return;
      const { moved } = drag;
      drag = null;
      if (!moved) return;
      setGrabbing(false);
      list.addEventListener("click", swallowClick, {
        capture: true,
        once: true,
      });
      setTimeout(
        () =>
          list.removeEventListener("click", swallowClick, { capture: true }),
        0
      );
    };
    list.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      list.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const yearFromPointer = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    return rect?.width
      ? yearAtChartFraction((clientX - rect.left) / rect.width)
      : null;
  };
  const chartDrag = {
    onPointerDown: (event: ReactPointerEvent<Element>) => {
      if (event.button) return;
      event.preventDefault();
      chartDragRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      const next = yearFromPointer(event.clientX);
      if (next != null) setYear(next);
    },
    onPointerMove: (event: ReactPointerEvent<Element>) => {
      if (!chartDragRef.current) return;
      const next = yearFromPointer(event.clientX);
      if (next != null) setYear(next);
    },
    onPointerUp: () => {
      chartDragRef.current = false;
    },
    onPointerCancel: () => {
      chartDragRef.current = false;
    },
  };

  const handleLeft = `${yearLineFraction(year) * 100}%`;
  const areaTitle = t(AREA_TITLE_KEYS[area]);

  return (
    <div
      onKeyDown={onKeyDown}
      className="wby-deep relative size-full max-[960px]:pb-[env(safe-area-inset-bottom,0px)]"
    >
      <header className="wby-deep-head flex min-w-0 items-center gap-3.5 border-b border-[var(--wby-line)] pb-2.5 pl-5 pr-5 pt-3.5 max-[960px]:pb-3 max-[960px]:pl-4 max-[960px]:pr-[52px] max-[720px]:flex-wrap max-[720px]:gap-y-1">
        <span className="relative size-7 flex-none overflow-hidden rounded-[4px]">
          <SectionTile section={area} />
        </span>
        <h3 className="m-0 min-w-0 flex-1 whitespace-nowrap text-[24px] font-normal leading-[1.1] tracking-[-0.005em] text-[var(--wby-fg)] max-[720px]:text-[21px]">
          {t.rich("worldByYearAreaHeading", {
            area: areaTitle,
            label: (chunks) => <span>{chunks}</span>,
            year: () => (
              <HeroYearControl
                year={year}
                scrubbing={false}
                onYearChange={changeYear}
                onScrubChange={ignoreScrub}
                withList={false}
                ariaLabel={t("worldByYearDeepYearLabel")}
              />
            ),
          })}
        </h3>
        <span className="text-[11px] leading-[1.3] tracking-[.01em] text-[var(--wby-muted)] max-[720px]:order-3 max-[720px]:basis-full max-[720px]:pl-[54px]">
          {t("worldByYearDeepCount", {
            index: String(index + 1),
            total: String(questions.length),
            source: question.metaculusId
              ? t("worldByYearDeepSourceMetaculus", {
                  id: String(question.metaculusId),
                })
              : t("worldByYearDeepSourceSample"),
          })}
        </span>
      </header>

      <button
        type="button"
        data-autofocus
        aria-label={t("close")}
        onClick={onClose}
        className="absolute right-3 top-3 z-[2] grid size-7 cursor-pointer place-items-center rounded-full border border-[var(--wby-line2)] bg-transparent text-[var(--wby-t1)] outline-none hover:bg-[var(--wby-line)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)] max-[960px]:right-3.5 max-[960px]:top-4"
      >
        <CloseIcon className="size-[13px]" />
      </button>

      <button
        type="button"
        aria-label={t("worldByYearPreviousForecast")}
        disabled={index === 0}
        onClick={() => step(-1)}
        className={cn(
          "wby-deep-prev",
          navClassName,
          "max-[720px]:justify-self-start"
        )}
      >
        <LongArrowIcon direction="left" className="size-3.5" />
      </button>

      <div
        ref={stageRef}
        className="wby-deep-stage grid min-w-0 place-items-center self-stretch overflow-y-auto pb-2 max-[960px]:pb-5 max-[720px]:touch-pan-y max-[720px]:pb-1"
      >
        <article
          ref={cardRef}
          key={index}
          className={cn(
            "flex w-[min(880px,100%)] flex-col gap-2.5 rounded-2xl px-8 py-5 motion-reduce:animate-none",
            direction < 0
              ? "animate-[wby-deep-in-back_.32s_cubic-bezier(.2,.8,.2,1)_both]"
              : "animate-[wby-deep-in_.32s_cubic-bezier(.2,.8,.2,1)_both]"
          )}
        >
          <div className="mb-1 flex items-center gap-[7px] text-[11px] font-medium leading-[1.3] tracking-[.01em]">
            <KindChip kind={question.kind} />
            {question.metaculusId && (
              <span className="min-w-0 truncate text-[var(--wby-muted)]">
                {t("worldByYearSourceMetaculus")}
              </span>
            )}
          </div>
          <p className="m-0 min-h-[calc(4*1.22em)] max-w-[30ch] text-[clamp(26px,2.6vw,36px)] font-normal leading-[1.22] tracking-[-0.005em] text-[var(--wby-fg)] [text-wrap:balance] max-[720px]:text-[22px] max-[720px]:leading-[1.2]">
            {questionTitle(question)}
          </p>
          <DensityChart
            question={question}
            year={year}
            className="relative mt-14 pt-2 max-[720px]:mt-7"
            svgClassName="h-[140px] cursor-ew-resize touch-none max-[720px]:h-24"
            svgProps={{ ref: svgRef, "data-deep-drag": "", ...chartDrag }}
          >
            <span
              aria-hidden
              data-deep-drag
              {...chartDrag}
              style={{ left: handleLeft }}
              className="absolute -top-[9px] z-[6] -ml-[14px] h-[18px] w-7 cursor-grab touch-none rounded-full bg-[var(--wby-year)] before:absolute before:-inset-x-1.5 before:-inset-y-2 before:content-[''] after:absolute after:inset-0 after:m-auto after:size-2.5 after:bg-[radial-gradient(circle,var(--wby-handle-dot)_0.7px,transparent_1px)] after:bg-[length:5px_3.5px] after:content-['']"
            />
            <span
              aria-hidden
              style={{ left: handleLeft }}
              className="pointer-events-none absolute -bottom-[18px] -translate-x-1/2 text-[11px] font-medium tabular-nums text-[var(--wby-year)]"
            >
              {year}
            </span>
          </DensityChart>
          <ForecastMeta
            question={question}
            year={year}
            className="mt-[22px] grid grid-cols-3 gap-3 border-t border-[var(--wby-line)] pt-[18px]"
            labelClassName="text-[11px] leading-[1.3] tracking-[.01em] text-[var(--wby-muted)]"
            valueClassName="text-[17px] text-[var(--wby-fg4)]"
          />
        </article>
      </div>

      <button
        type="button"
        aria-label={t("worldByYearNextForecast")}
        disabled={index === questions.length - 1}
        onClick={() => step(1)}
        className={cn(
          "wby-deep-next",
          navClassName,
          "max-[720px]:justify-self-end"
        )}
      >
        <LongArrowIcon direction="right" className="size-3.5" />
      </button>

      <div
        ref={listRef}
        className={cn(
          "wby-deep-list flex min-h-0 touch-pan-y flex-col gap-1 self-stretch overflow-y-auto border-l border-[var(--wby-line)] bg-[color-mix(in_srgb,var(--wby-card)_55%,transparent)] px-3.5 pb-6 pt-[18px] no-scrollbar max-[960px]:cursor-grab max-[960px]:gap-2 max-[960px]:overscroll-contain max-[960px]:border-l-0 max-[960px]:border-t max-[960px]:bg-[var(--wby-bg)] max-[960px]:px-3 max-[960px]:pb-3 max-[960px]:pt-0 max-[720px]:gap-1.5 max-[720px]:px-2.5 max-[720px]:pb-2.5",
          grabbing && "cursor-grabbing select-none max-[960px]:cursor-grabbing"
        )}
      >
        <p
          data-deep-heading
          className="relative m-0 px-3 pb-2.5 pt-1 text-[10.5px] leading-[normal] tracking-[.01em] text-[var(--wby-muted)] max-[960px]:sticky max-[960px]:top-0 max-[960px]:z-[1] max-[960px]:-mx-3 max-[960px]:bg-[var(--wby-bg)] max-[960px]:px-6 max-[960px]:pb-2 max-[960px]:pt-3 max-[960px]:after:pointer-events-none max-[960px]:after:absolute max-[960px]:after:inset-x-0 max-[960px]:after:top-full max-[960px]:after:h-[22px] max-[960px]:after:bg-[linear-gradient(var(--wby-bg),color-mix(in_srgb,var(--wby-bg)_0%,transparent))] max-[960px]:after:content-['']"
        >
          {t("worldByYearDeepSortHeading")}
        </p>
        {questions.map((item, i) => {
          const active = i === index;
          return (
            <button
              key={item.id}
              type="button"
              data-deep-item
              aria-current={active ? "true" : undefined}
              onClick={() => select(i)}
              className={cn(
                "grid w-full flex-none cursor-pointer grid-cols-[10px_1fr] items-start gap-3 rounded-[10px] border border-transparent bg-transparent p-3 text-left text-[var(--wby-t1)] outline-none transition-[border-color,background-color,color] duration-200 hover:bg-[rgba(var(--wby-ink),.05)] hover:text-[var(--wby-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--wby-year)] max-[960px]:rounded-xl max-[960px]:bg-[rgba(var(--wby-ink),.04)] max-[960px]:px-3.5 max-[960px]:py-3 max-[720px]:rounded-[10px] max-[720px]:px-3 max-[720px]:py-2.5",
                active &&
                  "bg-[rgba(var(--wby-ink),.09)] text-[var(--wby-fg)] max-[960px]:bg-[rgba(var(--wby-ink),.1)]"
              )}
            >
              <span
                className="mt-1 size-2.5 rounded-[2px]"
                style={{ background: KIND_COLOR[item.kind] }}
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium leading-[1.35] [text-wrap:pretty] max-[720px]:text-[13px]">
                  {questionTitle(item)}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[10.5px] uppercase leading-[1.3] tracking-[.06em] text-[var(--wby-muted)]",
                    active && "text-[var(--wby-t2)]"
                  )}
                >
                  {quartileRange(item)} · {formatDate(item.median)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

type Session = { id: number; target: DiveDeeperTarget; open: boolean };

// One forecast at a time with its own year, next to the area's full list;
// the page behind stays put.
export const DiveDeeperProvider: FC<PropsWithChildren> = ({ children }) => {
  const t = useTranslations();
  const { byId, questions } = useWorldData();
  const [session, setSession] = useState<Session | null>(null);
  const hasTarget = useCallback(
    (target: DiveDeeperTarget) =>
      target.questionId
        ? byId.get(target.questionId)?.area === target.area
        : questions.some((question) => question.area === target.area),
    [byId, questions]
  );
  const open = useCallback(
    (target: DiveDeeperTarget) => {
      if (!hasTarget(target)) return;
      setSession((previous) => ({
        id: (previous?.id ?? 0) + 1,
        target,
        open: true,
      }));
    },
    [hasTarget]
  );
  const close = useCallback(
    () => setSession((previous) => previous && { ...previous, open: false }),
    []
  );
  const validSession = session && hasTarget(session.target);

  return (
    <DiveDeeperContext.Provider value={open}>
      {children}
      <Dialog
        open={!!session?.open && !!validSession}
        onClose={close}
        aria-label={
          session ? t(AREA_TITLE_KEYS[session.target.area]) : undefined
        }
        className={cn(
          WORLD_BY_YEAR_THEME_CLASSNAME,
          "relative z-modal font-sans"
        )}
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-[rgba(44,73,105,.22)] transition-opacity duration-[280ms] ease-[ease] data-[closed]:opacity-0 dark:bg-[rgba(0,0,0,.32)]"
        />
        <DialogPanel
          transition
          className="fixed inset-0 m-auto h-[min(990px,calc(100svh-48px))] w-[min(1560px,calc(100vw-48px))] origin-[50%_60%] overflow-hidden rounded-[22px] border border-[var(--wby-line2)] bg-[var(--wby-bg)] text-[var(--wby-fg3)] shadow-[0_30px_90px_rgba(44,73,105,.22)] [transition:opacity_.28s_ease,transform_.32s_cubic-bezier(.2,.8,.2,1)] data-[closed]:opacity-0 data-[closed]:[transform:scale(.98)_translateY(10px)] motion-reduce:data-[closed]:[transform:none] dark:shadow-[0_30px_90px_rgba(0,0,0,.45),0_0_0_1px_rgba(0,0,0,.08)] max-[960px]:h-dvh max-[960px]:w-auto max-[960px]:rounded-none max-[960px]:border-0 max-[960px]:!shadow-none"
        >
          {session && validSession && (
            <DiveDeeperView
              key={session.id}
              area={session.target.area}
              questionId={session.target.questionId}
              onClose={close}
            />
          )}
        </DialogPanel>
      </Dialog>
    </DiveDeeperContext.Provider>
  );
};

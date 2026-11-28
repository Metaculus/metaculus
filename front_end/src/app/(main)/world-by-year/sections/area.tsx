"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import AreaNarrative from "../components/area_narrative";
import AuroraCanvas from "../components/aurora_canvas";
import { useDiveDeeper } from "../components/dive_deeper";
import ForecastCard from "../components/forecast_card";
import HeroYearControl from "../components/hero_year_control";
import { LongArrowIcon } from "../components/icons";
import StatementDeck from "../components/statement_deck";
import SwimlaneChart, { LaneFocus } from "../components/swimlane_chart";
import { WORLD_BY_YEAR_THEME_CLASSNAME } from "../components/theme";
import { useWorldData } from "../components/world_data_provider";
import { useWorldYear } from "../components/world_year_provider";
import {
  AREA_ORDER,
  AREA_PALETTES,
  AREA_SECTIONS,
} from "../data/area_sections";
import { AREA_TITLE_KEYS, WorldArea } from "../data/questions";
import {
  closestQuestions,
  defaultStatementIndex,
  periodsFor,
  statementsFor,
} from "../helpers/area_section";
import { sectionAurora } from "../helpers/aurora_effect";

const GLASS_CELL_PX = 14;

type Selection = { year: number; index: number; focus: LaneFocus };

const arrowClassName =
  "inline-grid size-[38px] cursor-pointer place-items-center rounded-full border border-[rgba(var(--wby-ink),.3)] bg-[rgba(var(--wby-ink),.05)] text-[var(--wby-fg)] transition-[background-color,transform,opacity] duration-150 hover:bg-[rgba(var(--wby-ink),.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)] active:scale-[.94] disabled:pointer-events-none disabled:cursor-default disabled:opacity-30 max-[720px]:size-10";

export function AreaSection({ area }: { area: WorldArea }) {
  const t = useTranslations();
  const locale = useLocale();
  const openDiveDeeper = useDiveDeeper();
  const { questions } = useWorldData();
  const {
    year,
    settledYear,
    settleCount,
    scrubbing,
    holdRef,
    changeYear,
    changeScrubbing,
    jumpTarget,
  } = useWorldYear();
  const copy = AREA_SECTIONS[area];
  const title = t(AREA_TITLE_KEYS[area]);
  const palette = AREA_PALETTES[area];

  const headRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLCanvasElement>(null);
  const pauseRef = useRef(false);
  const focusIdRef = useRef(0);
  const firstSettleRef = useRef(true);

  const statements = useMemo(
    () => statementsFor(questions, area),
    [questions, area]
  );
  const periods = useMemo(
    () => periodsFor(questions, area, copy),
    [questions, area, copy]
  );
  const cards = useMemo(
    () => closestQuestions(questions, area, settledYear),
    [questions, area, settledYear]
  );
  const auroraConfig = useMemo(
    () => sectionAurora(palette, AREA_ORDER.indexOf(area)),
    [palette, area]
  );

  // A pick made for one year gives way to the default pick once the year
  // settles somewhere else.
  const [selection, setSelection] = useState<Selection | null>(null);
  const defaultIndex = defaultStatementIndex(statements, settledYear);
  const picked = selection?.year === settledYear ? selection : null;
  const activeIndex = picked ? picked.index : defaultIndex;
  const focus = useMemo<LaneFocus>(
    () =>
      picked?.focus ?? {
        index: defaultIndex,
        smooth: true,
        fade: false,
        id: -settledYear,
      },
    [picked, defaultIndex, settledYear]
  );

  const select = (index: number, mode: "nav" | "lane") => {
    const next = Math.max(0, Math.min(statements.length - 1, index));
    if (mode === "nav" && next === activeIndex) return;
    focusIdRef.current += 1;
    setSelection({
      year: settledYear,
      index: next,
      focus: {
        index: next,
        smooth: mode === "lane",
        fade: mode === "nav",
        id: focusIdRef.current,
      },
    });
  };

  useEffect(() => {
    if (jumpTarget?.area !== area) return;
    const index = statements.findIndex((q) => q.id === jumpTarget.questionId);
    if (index < 0) return;
    focusIdRef.current += 1;
    setSelection({
      year: jumpTarget.year,
      index,
      focus: { index, smooth: true, fade: false, id: focusIdRef.current },
    });
    sectionRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
    headRef.current?.focus({ preventScroll: true });
  }, [area, jumpTarget, statements]);

  // The glass behind the statement box is the band itself: each band frame,
  // the patch behind the box is copied into a tiny canvas that the browser
  // scales back up, which blurs it for free.
  const drawGlass = useCallback((band: HTMLCanvasElement) => {
    const box = boxRef.current;
    const glass = glassRef.current;
    const glassCtx = glass?.getContext("2d");
    if (!box || !glass || !glassCtx) return;
    const boxRect = box.getBoundingClientRect();
    const bandRect = band.getBoundingClientRect();
    if (!boxRect.width || !bandRect.width) return;
    const cols = Math.max(2, Math.ceil(boxRect.width / GLASS_CELL_PX));
    const rows = Math.max(2, Math.ceil(boxRect.height / GLASS_CELL_PX));
    if (glass.width !== cols || glass.height !== rows) {
      glass.width = cols;
      glass.height = rows;
    }
    const scale = band.width / bandRect.width;
    glassCtx.imageSmoothingEnabled = true;
    glassCtx.imageSmoothingQuality = "high";
    glassCtx.filter = "none";
    glassCtx.fillStyle =
      getComputedStyle(box).getPropertyValue("--wby-bg").trim() || "#1c2127";
    glassCtx.fillRect(0, 0, cols, rows);
    glassCtx.filter = "blur(1.4px) saturate(1.15)";
    const sx = (boxRect.left - bandRect.left) * scale;
    const sy = (boxRect.top - bandRect.top) * scale;
    const sw = boxRect.width * scale;
    const sh = boxRect.height * scale;
    const offsetX = Math.max(0, -sx);
    const offsetY = Math.max(0, -sy);
    const clipW = sw - offsetX - Math.max(0, sx + sw - band.width);
    const clipH = sh - offsetY - Math.max(0, sy + sh - band.height);
    if (clipW <= 0 || clipH <= 0) return;
    glassCtx.drawImage(
      band,
      sx + offsetX,
      sy + offsetY,
      clipW,
      clipH,
      (offsetX / sw) * cols,
      (offsetY / sh) * rows,
      (clipW / sw) * cols,
      (clipH / sh) * rows
    );
  }, []);
  const onDrawRef = useRef(drawGlass);

  useEffect(() => {
    if (firstSettleRef.current) {
      firstSettleRef.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document
      .querySelectorAll<HTMLElement>(`[data-settle="${area}"]`)
      .forEach((el) =>
        el.animate([{ opacity: 0.35 }, { opacity: 1 }], {
          duration: 300,
          easing: "ease-out",
        })
      );
  }, [settleCount, area]);

  const dimClassName = cn(
    "transition-opacity duration-[220ms] ease-[ease]",
    scrubbing && "pointer-events-none opacity-30"
  );
  const diveDeeperAll = t("worldByYearDiveDeeperAll", {
    count: statements.length,
    area: title.toLocaleLowerCase(locale),
  });
  const openQuestion = (questionId: string) =>
    openDiveDeeper({ area, questionId });
  const laneLabels = statements.map((q) => {
    const questionCopy = copy.questions[q.id];
    return questionCopy ? t(questionCopy.laneKey) : "";
  });

  if (!statements.length) return null;

  return (
    <section
      ref={sectionRef}
      data-wby-section={area}
      className={cn(
        WORLD_BY_YEAR_THEME_CLASSNAME,
        "scroll-mt-[calc(var(--top-chrome-height,3rem)+3rem)] overflow-x-clip bg-[var(--wby-bg)] font-sans text-[14px] text-[var(--wby-fg3)]"
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-[var(--wby-pad)]">
        <div className="relative border-b border-[var(--wby-line)] pb-12 pt-11">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[-200px] z-0 h-[760px] w-screen -translate-x-1/2 [clip-path:inset(200px_0_0_0)]"
          >
            <AuroraCanvas
              config={auroraConfig}
              headRef={headRef}
              holdRef={holdRef}
              pauseRef={pauseRef}
              onDrawRef={onDrawRef}
              className="absolute inset-0 size-full"
            />
          </div>

          <div className="relative z-[2] mb-16 max-[720px]:mb-10">
            <div className="flex items-center gap-4 max-[720px]:flex-nowrap max-[720px]:justify-between max-[720px]:gap-2.5">
              <h2
                ref={headRef}
                tabIndex={-1}
                className="m-0 text-[clamp(26px,2.6vw,34px)] font-normal leading-[1.1] tracking-[-0.005em] text-[var(--wby-fg)] [text-shadow:0_1px_3px_color-mix(in_srgb,var(--wby-bg)_28%,transparent)] max-[720px]:min-w-0 max-[720px]:whitespace-nowrap max-[720px]:text-[22px]"
              >
                {t.rich("worldByYearAreaHeading", {
                  area: title,
                  label: (chunks) => (
                    <span data-settle={area} className={dimClassName}>
                      {chunks}
                    </span>
                  ),
                  year: () => (
                    <HeroYearControl
                      year={year}
                      scrubbing={scrubbing}
                      onYearChange={changeYear}
                      onScrubChange={changeScrubbing}
                      hideArrowsOnPhones
                    />
                  ),
                })}
              </h2>
              <div
                data-settle={area}
                className={cn(
                  "hidden flex-none max-[720px]:flex",
                  dimClassName
                )}
              >
                <button
                  type="button"
                  aria-label={diveDeeperAll}
                  onClick={() => openDiveDeeper({ area })}
                  className="inline-flex cursor-pointer items-center gap-[3px] whitespace-nowrap rounded-full border border-[rgba(var(--wby-ink),.22)] bg-transparent px-[9px] py-[5px] text-[12px] font-medium text-[var(--wby-t1)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)]"
                >
                  {t("worldByYearDiveDeeper")}
                  <LongArrowIcon direction="right" className="ml-0.5 size-3" />
                </button>
              </div>
            </div>

            <div
              ref={boxRef}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") pauseRef.current = true;
              }}
              onPointerLeave={() => {
                pauseRef.current = false;
              }}
              style={
                {
                  "--wby-p0": palette[0].join(","),
                  "--wby-p1": palette[1].join(","),
                } as CSSProperties
              }
              className="relative mt-8 grid grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] overflow-hidden rounded-[20px] shadow-[0_18px_44px_rgba(44,73,105,.1)] after:pointer-events-none after:absolute after:inset-0 after:z-[3] after:rounded-[inherit] after:p-px after:content-[''] after:[background:linear-gradient(180deg,var(--wby-ring-1),var(--wby-ring-2)_45%,var(--wby-ring-3))] after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] dark:shadow-[0_18px_50px_rgba(0,0,0,.18)] max-[1100px]:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] max-[720px]:mt-5 max-[720px]:grid-cols-1 max-[720px]:rounded-[18px]"
            >
              <canvas
                ref={glassRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 size-full"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(150deg,rgba(var(--wby-p0),.12),rgba(var(--wby-p1),.05)_45%,transparent_75%),linear-gradient(180deg,var(--wby-veil-1),var(--wby-veil-2)_60%,var(--wby-veil-3))]"
              />
              <StatementDeck
                statements={statements}
                activeIndex={activeIndex}
                year={settledYear}
                areaTitle={title}
                dimClassName={dimClassName}
                settleGroup={area}
                onOpen={openQuestion}
              />
              <SwimlaneChart
                areaTitle={title}
                statements={statements}
                laneLabels={laneLabels}
                focus={focus}
                year={year}
                settledYear={settledYear}
                scrubbing={scrubbing}
                dimClassName={dimClassName}
                settleGroup={area}
                onSelect={(index) => select(index, "lane")}
              />
            </div>

            <div
              className={cn(
                "mt-5 flex items-center justify-center gap-3.5 max-[720px]:mt-4 max-[720px]:gap-2.5",
                dimClassName
              )}
            >
              <button
                type="button"
                aria-label={t("worldByYearPreviousStatement")}
                disabled={activeIndex === 0}
                onClick={() => select(activeIndex - 1, "nav")}
                className={arrowClassName}
              >
                <LongArrowIcon direction="left" className="size-[15px]" />
              </button>
              <span
                aria-live="polite"
                className="min-w-[44px] text-center text-[11px] tabular-nums text-[var(--wby-t2)] max-[720px]:hidden"
              >
                {activeIndex + 1}/{statements.length}
              </span>
              <span className="hidden items-center max-[720px]:flex">
                {statements.map((question, i) => (
                  <button
                    key={question.id}
                    type="button"
                    aria-label={t("worldByYearStatementOf", {
                      index: String(i + 1),
                      total: String(statements.length),
                    })}
                    aria-current={i === activeIndex}
                    onClick={() => select(i, "nav")}
                    className="grid h-7 w-4 cursor-pointer place-items-center"
                  >
                    <span
                      className={cn(
                        "size-[7px] rounded-full transition-[background-color,transform] duration-200",
                        i === activeIndex
                          ? "scale-[1.3] bg-[var(--wby-fg)]"
                          : "bg-[rgba(var(--wby-ink),.25)]"
                      )}
                    />
                  </button>
                ))}
              </span>
              <button
                type="button"
                aria-label={t("worldByYearNextStatement")}
                disabled={activeIndex === statements.length - 1}
                onClick={() => select(activeIndex + 1, "nav")}
                className={arrowClassName}
              >
                <LongArrowIcon direction="right" className="size-[15px]" />
              </button>
            </div>
          </div>

          <div
            data-settle={area}
            className={cn(
              "relative z-[1] -mt-2 flex flex-wrap gap-x-14 gap-y-7 pb-12 pt-14",
              dimClassName
            )}
          >
            <AreaNarrative
              periods={periods}
              year={settledYear}
              onYearChange={changeYear}
            />
            <div className="flex min-w-[min(280px,100%)] flex-[1_1_340px] flex-col gap-6">
              {cards.map((question) => {
                const questionCopy = copy.questions[question.id];
                return questionCopy ? (
                  <ForecastCard
                    key={question.id}
                    question={question}
                    copy={questionCopy}
                    year={settledYear}
                    onOpen={() => openQuestion(question.id)}
                  />
                ) : null;
              })}
              <button
                type="button"
                onClick={() => openDiveDeeper({ area })}
                className="mt-1 inline-flex cursor-pointer items-center gap-1 self-start whitespace-nowrap rounded-full border border-[var(--wby-line2)] bg-transparent px-3 py-[7px] text-[13px] font-medium text-[var(--wby-t1)] outline-none transition-colors duration-150 hover:bg-[var(--wby-card)] hover:text-[var(--wby-fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wby-year)]"
              >
                {diveDeeperAll}
                <LongArrowIcon direction="right" className="size-[13px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import type { Messages } from "next-intl";
import { useTranslations } from "next-intl";
import {
  FC,
  RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import HeroYearControl, { HeroYearControlTwin } from "./hero_year_control";
import MiniTimeline from "./mini_timeline";
import SectionTile from "./section_tile";
import { WORLD_BY_YEAR_THEME_CLASSNAME } from "./theme";
import { useWorldYear } from "./world_year_provider";
import { AREA_TITLE_KEYS } from "../data/questions";
import { PAGE_SECTIONS, PageSection } from "../helpers/top_bar";

// How far below the bar the section under the title is read.
const SECTION_PROBE_PX = 24;
const ROLL_SETTLE_MS = 520;

const TITLE_KEYS: Record<PageSection, keyof Messages> = {
  hero: "worldByYearTopBarHero",
  overview: "worldByYearTopBarOverview",
  ...AREA_TITLE_KEYS,
};

type Direction = 1 | -1;

type ActiveSection = {
  section: PageSection;
  direction: Direction;
  animate: boolean;
};

// Scrolling down, the next name comes up from below and the old one leaves
// through the top; scrolling up, the other way round. The spans are built
// here rather than by React so a leaving name can finish its transition.
const rollTitle = (
  el: HTMLElement,
  text: string,
  direction: Direction,
  animate: boolean,
  timerRef: RefObject<ReturnType<typeof setTimeout> | undefined>
) => {
  const makeSpan = () => {
    const span = document.createElement("span");
    span.className = "wby-roll-current";
    span.textContent = text;
    return span;
  };
  const current = el.querySelector<HTMLElement>(":scope > .wby-roll-current");
  if (current?.textContent === text) return;
  if (!current || !animate) {
    clearTimeout(timerRef.current);
    el.style.width = "";
    el.replaceChildren(makeSpan());
    return;
  }
  el.querySelectorAll(":scope > .wby-roll-out").forEach((node) =>
    node.remove()
  );
  const startWidth = el.getBoundingClientRect().width;
  current.className = "wby-roll-out";
  current.style.setProperty("--dy", `${-direction * 100}%`);
  current.style.setProperty("--rx", `${direction * 70}deg`);
  const next = makeSpan();
  next.classList.add("wby-roll-in");
  next.style.setProperty("--dy", `${direction * 100}%`);
  next.style.setProperty("--rx", `${-direction * 70}deg`);
  el.appendChild(next);
  // Layout width: the bounding box would include the 3D tilt.
  const endWidth = next.offsetWidth;
  el.style.width = `${startWidth}px`;
  void el.offsetWidth;
  el.style.width = `${endWidth}px`;
  void next.getBoundingClientRect();
  next.classList.remove("wby-roll-in");
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    el.querySelectorAll(":scope > .wby-roll-out").forEach((node) =>
      node.remove()
    );
    el.style.transition = "none";
    el.style.width = "";
    void el.offsetWidth;
    el.style.transition = "";
  }, ROLL_SETTLE_MS);
};

const rollTile = (
  el: HTMLElement,
  section: PageSection,
  direction: Direction,
  animate: boolean
) => {
  for (const tile of Array.from(el.children) as HTMLElement[]) {
    const on = tile.dataset.section === section;
    if (!animate) {
      tile.style.transition = "none";
      tile.style.setProperty("--ty", "0%");
      tile.classList.toggle("wby-tile-on", on);
      void tile.offsetWidth;
      tile.style.transition = "";
    } else if (on && !tile.classList.contains("wby-tile-on")) {
      tile.style.transition = "none";
      tile.style.setProperty("--ty", `${direction * 100}%`);
      void tile.offsetWidth;
      tile.style.transition = "";
      tile.style.setProperty("--ty", "0%");
      tile.classList.add("wby-tile-on");
    } else if (!on && tile.classList.contains("wby-tile-on")) {
      tile.style.setProperty("--ty", `${-direction * 100}%`);
      tile.classList.remove("wby-tile-on");
    }
  }
};

const RollingTitle: FC<{ text: string } & Omit<ActiveSection, "section">> = ({
  text,
  direction,
  animate,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useLayoutEffect(() => {
    if (ref.current) rollTitle(ref.current, text, direction, animate, timerRef);
  }, [text, direction, animate]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return <span ref={ref} className="wby-roll" />;
};

export default function TopBar() {
  const t = useTranslations();
  const { year, scrubbing, changeYear, changeScrubbing } = useWorldYear();
  const barRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<ActiveSection>({
    section: "hero",
    direction: 1,
    animate: false,
  });

  const titles = useMemo(
    () =>
      Object.fromEntries(
        PAGE_SECTIONS.map((section) => [section, t(TITLE_KEYS[section])])
      ) as Record<PageSection, string>,
    [t]
  );

  // Shown once the hero timeline has scrolled under the site header; the
  // title names the section just below the bar.
  useEffect(() => {
    const track = document.querySelector("[data-wby-track]");
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-wby-section]")
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastScrollY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar || !track) return;
      const chromeBottom = bar.offsetTop;
      const nextShown = track.getBoundingClientRect().bottom < chromeBottom;
      const probe = chromeBottom + bar.offsetHeight + SECTION_PROBE_PX;
      let section: PageSection | null = null;
      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) {
          section = el.dataset.wbySection as PageSection;
        }
      }
      const direction: Direction = window.scrollY >= lastScrollY ? 1 : -1;
      lastScrollY = window.scrollY;
      setShown(nextShown);
      setActive((previous) => {
        const nextSection = section ?? previous.section;
        return previous.section === nextSection
          ? previous
          : {
              section: nextSection,
              direction,
              animate: nextShown && !reducedMotion.matches,
            };
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useLayoutEffect(() => {
    if (tileRef.current) {
      rollTile(
        tileRef.current,
        active.section,
        active.direction,
        active.animate
      );
    }
  }, [active]);

  return (
    <div
      ref={barRef}
      inert={!shown}
      className={cn(
        WORLD_BY_YEAR_THEME_CLASSNAME,
        "fixed inset-x-0 top-header z-40 border-b border-[var(--wby-line)] bg-[color-mix(in_srgb,var(--wby-bg)_80%,transparent)] font-sans backdrop-blur-[18px] backdrop-saturate-[1.15] transition-transform duration-[320ms] ease-[cubic-bezier(.23,1,.32,1)]",
        shown ? "translate-y-0" : "-translate-y-[105%]"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-[var(--wby-pad)] py-1.5 max-[720px]:py-1">
        <div className="flex flex-none items-center gap-2.5">
          <span
            ref={tileRef}
            aria-hidden
            className="wby-tile relative size-7 flex-none overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_rgba(44,73,105,.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]"
          >
            {PAGE_SECTIONS.map((section) => (
              <span
                key={section}
                data-section={section}
                className={section === "hero" ? "wby-tile-on" : undefined}
              >
                <SectionTile section={section} />
              </span>
            ))}
          </span>
          {/* Every title is laid out invisibly in the same cell, so the block
              is as wide as the longest one and the timeline never moves. */}
          <p className="m-0 inline-grid flex-none items-baseline justify-items-start whitespace-nowrap text-[18px] font-normal leading-[1.2] tracking-[-0.005em] text-[var(--wby-fg)]">
            <span
              aria-hidden
              className="pointer-events-none invisible grid select-none [grid-area:1/1]"
            >
              {PAGE_SECTIONS.map((section) => (
                <span
                  key={section}
                  className="whitespace-nowrap [grid-area:1/1]"
                >
                  {t.rich("worldByYearTopBarTitle", {
                    title: () => titles[section],
                    year: () => <HeroYearControlTwin year={year} />,
                  })}
                </span>
              ))}
            </span>
            <span className="whitespace-nowrap [grid-area:1/1]">
              {t.rich("worldByYearTopBarTitle", {
                title: () => (
                  <RollingTitle
                    text={titles[active.section]}
                    direction={active.direction}
                    animate={active.animate}
                  />
                ),
                year: () => (
                  <HeroYearControl
                    year={year}
                    scrubbing={scrubbing}
                    onYearChange={changeYear}
                    onScrubChange={changeScrubbing}
                  />
                ),
              })}
            </span>
          </p>
        </div>
        <div className="min-w-0 flex-1 max-[900px]:hidden">
          <MiniTimeline
            year={year}
            onYearChange={changeYear}
            onScrubChange={changeScrubbing}
          />
        </div>
      </div>
    </div>
  );
}

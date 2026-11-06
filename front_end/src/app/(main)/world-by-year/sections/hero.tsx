"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";

import cn from "@/utils/core/cn";

import HeroAurora from "../components/hero_aurora";
import { GRAIN_IMAGE, HERO_THEME_CLASSNAME } from "../components/hero_theme";
import HeroTimeline from "../components/hero_timeline";
import HeroYearControl, {
  HeroYearControlTwin,
} from "../components/hero_year_control";
import { PlayPauseIcon } from "../components/icons";
import { useWorldYear } from "../components/world_year_provider";

export function HeroSection() {
  const t = useTranslations();
  const heroRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const frostRef = useRef<HTMLSpanElement>(null);
  const {
    year,
    playing,
    scrubbing,
    holdRef,
    changeYear,
    changeScrubbing,
    togglePlay,
  } = useWorldYear();

  return (
    <section
      ref={heroRef}
      className={cn(
        HERO_THEME_CLASSNAME,
        "relative flex min-h-[calc(100svh-var(--top-chrome-height,3rem))] flex-col overflow-hidden bg-[var(--wby-bg)] font-sans text-[14px] text-[var(--wby-fg3)]"
      )}
    >
      <HeroAurora headRef={headRef} frostRef={frostRef} holdRef={holdRef} />
      <div
        ref={headRef}
        className="relative z-[2] mx-auto w-full max-w-[1280px] px-[var(--wby-pad)] pt-[76px]"
      >
        <h1 className="relative m-0 font-sans text-[clamp(40px,5.2vw,68px)] font-normal leading-[1.04] tracking-[-0.02em] text-[color-mix(in_srgb,var(--wby-fg)_75%,transparent)]">
          <span
            ref={frostRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-clip-text text-transparent [filter:brightness(1.6)_saturate(1.3)_contrast(.9)]"
          >
            {t.rich("worldByYearHeadline", {
              br: () => <br />,
              year: () => <HeroYearControlTwin year={year} />,
            })}
          </span>
          {t.rich("worldByYearHeadline", {
            br: () => <br />,
            year: () => (
              <HeroYearControl
                year={year}
                scrubbing={scrubbing}
                onYearChange={changeYear}
                onScrubChange={changeScrubbing}
              />
            ),
          })}
        </h1>
        <div className="mt-[14px] flex items-center gap-[18px] text-[12px] text-[var(--wby-t2)]">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={t(
              playing ? "worldByYearPause" : "worldByYearPlayLabel"
            )}
            className="relative inline-flex items-center gap-2 rounded-full border border-[rgba(var(--wby-ink),.18)] bg-[var(--wby-frost)] py-1.5 pl-2.5 pr-3.5 font-sans text-[13px] font-medium text-[var(--wby-fg)] backdrop-blur-[14px] hover:bg-[var(--wby-frost-hover)]"
          >
            <PlayPauseIcon playing={playing} className="size-3.5" />
            <span>{t(playing ? "worldByYearPause" : "worldByYearPlay")}</span>
          </button>
        </div>
      </div>
      <HeroTimeline
        year={year}
        playing={playing}
        heroRef={heroRef}
        headRef={headRef}
        onYearChange={changeYear}
        onScrubChange={changeScrubbing}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[length:180px_180px] opacity-[.07] mix-blend-multiply dark:opacity-[.055] dark:mix-blend-screen"
        style={{ backgroundImage: GRAIN_IMAGE }}
      />
    </section>
  );
}

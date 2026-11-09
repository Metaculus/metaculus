"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import ForecastMeta from "./forecast_meta";
import { KIND_COLOR } from "./milestone_card";
import { WorldQuestion } from "../data/questions";

type Props = {
  statements: WorldQuestion[];
  activeIndex: number;
  year: number;
  areaTitle: string;
  dimClassName: string;
  settleGroup?: string;
};

const StatementDeck: FC<Props> = ({
  statements,
  activeIndex,
  year,
  areaTitle,
  dimClassName,
  settleGroup,
}) => {
  const t = useTranslations();

  return (
    <div data-settle={settleGroup} className="relative z-[2] min-w-0">
      <div
        aria-roledescription="carousel"
        aria-label={t("worldByYearStatementsLabel", { area: areaTitle })}
        className="grid h-full"
      >
        {statements.map((question, i) => {
          const active = i === activeIndex;
          return (
            <article
              key={question.id}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "flex h-full min-h-[440px] flex-col px-10 pb-8 pt-6 [grid-area:1/1] max-[1100px]:px-[30px] max-[1100px]:pb-[26px] max-[1100px]:pt-[30px] max-[720px]:min-h-0 max-[720px]:px-6 max-[720px]:pb-6 max-[720px]:pt-[26px]",
                active
                  ? "visible"
                  : "pointer-events-none invisible [transition:visibility_0s_linear_.5s]"
              )}
            >
              <div className={cn("flex h-full flex-col", dimClassName)}>
                <div
                  className={cn(
                    "flex items-center gap-2 text-[11px] font-medium leading-[1.3] tracking-[.01em] transition-opacity duration-200",
                    !active && "opacity-0"
                  )}
                >
                  <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[rgba(var(--wby-ink),.1)] bg-[rgba(var(--wby-ink),.07)] py-[3px] pl-[7px] pr-[9px]">
                    <i
                      className="size-[7px] shrink-0 rounded-[2px]"
                      style={{ background: KIND_COLOR[question.kind] }}
                    />
                    <span style={{ color: KIND_COLOR[question.kind] }}>
                      {t(
                        question.kind === "cap"
                          ? "worldByYearCapability"
                          : "worldByYearAdoption"
                      )}
                    </span>
                  </span>
                  {question.metaculusId && (
                    <span className="min-w-0 truncate text-[rgba(var(--wby-ink),.5)]">
                      {t("worldByYearSourceMetaculus")}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "my-auto pb-8 pt-7 text-[clamp(26px,2.6vw,36px)] font-normal leading-[1.08] tracking-[-0.005em] text-[var(--wby-fg)] max-[720px]:pb-[26px] max-[720px]:pt-[22px]",
                    active
                      ? "opacity-100 [transition:transform_.42s_cubic-bezier(.16,1,.3,1),opacity_.26s_ease-out_.04s]"
                      : "opacity-0 [transition:transform_.38s_cubic-bezier(.16,1,.3,1),opacity_.14s_linear] motion-reduce:!translate-y-0",
                    !active &&
                      (i < activeIndex ? "-translate-y-5" : "translate-y-5")
                  )}
                >
                  {t(question.headlineKey)}
                </p>
                <ForecastMeta
                  question={question}
                  year={year}
                  className={cn(
                    "grid grid-cols-[repeat(3,minmax(0,auto))] justify-between gap-x-6 gap-y-4 border-t border-[rgba(var(--wby-ink),.12)] pt-[18px] max-[720px]:grid-cols-3",
                    !active && "invisible"
                  )}
                  labelClassName="whitespace-nowrap text-[11px] leading-[1.3] tracking-[.01em] text-[rgba(var(--wby-ink),.5)]"
                  valueClassName={cn(
                    "visible whitespace-nowrap text-[15px] text-[rgba(var(--wby-ink),.94)] transition-opacity duration-200 max-[720px]:text-[14px]",
                    !active && "opacity-0"
                  )}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default StatementDeck;

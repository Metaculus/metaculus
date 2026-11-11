"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import DensityChart from "./density_chart";
import ForecastMeta from "./forecast_meta";
import { OpenIcon } from "./icons";
import KindChip from "./kind_chip";
import { QuestionCopy } from "../data/area_sections";
import { WorldQuestion } from "../data/questions";

type Props = {
  question: WorldQuestion;
  copy: QuestionCopy;
  year: number;
  onOpen: () => void;
};

const ForecastCard: FC<Props> = ({ question, copy, year, onOpen }) => {
  const t = useTranslations();
  const title = t(copy.titleKey);

  return (
    <article className="group/card relative flex min-w-0 flex-col gap-2.5 rounded-2xl border border-[rgba(var(--wby-ink),.12)] bg-[var(--wby-panel)] p-5 transition-[border-color] duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-[rgba(var(--wby-ink),.32)]">
      <div className="flex items-center gap-[7px] pr-[18px] text-[11px] font-medium leading-[1.3] tracking-[.01em]">
        <KindChip kind={question.kind} />
        {question.metaculusId && (
          <span className="min-w-0 truncate text-[var(--wby-muted)]">
            {t("worldByYearSourceMetaculus")}
          </span>
        )}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-[color-mix(in_srgb,var(--wby-fg)_16%,var(--wby-card))] text-[var(--wby-fg)] transition-[background-color,transform] duration-200 ease-[cubic-bezier(.23,1,.32,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-px [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:translate-x-px [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-[color-mix(in_srgb,var(--wby-fg)_26%,var(--wby-card))]"
      >
        <OpenIcon className="size-3" />
      </span>
      <h3 className="m-0 text-[20px] font-normal leading-[1.2] tracking-[-0.005em] text-[var(--wby-fg)] [text-wrap:balance]">
        {/* The whole card opens the forecast; the forecasters link sits
            above this overlay. */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={t("worldByYearOpenForecastNamed", { title })}
          className="cursor-pointer appearance-none border-0 bg-transparent p-0 text-left text-inherit outline-none [font:inherit] after:absolute after:inset-0 after:z-0 after:rounded-[inherit] after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--wby-year)]"
        >
          {title}
        </button>
      </h3>
      <DensityChart
        question={question}
        year={year}
        className="mt-auto pt-2"
        svgClassName="h-14"
      />
      <ForecastMeta
        question={question}
        year={year}
        className="mt-3.5 grid grid-cols-3 gap-3 border-t border-[var(--wby-line)] pt-3"
        labelClassName="text-[11px] leading-[1.3] tracking-[.01em] text-[var(--wby-muted)]"
        valueClassName="text-[15px] text-[var(--wby-fg4)]"
      />
    </article>
  );
};

export default ForecastCard;

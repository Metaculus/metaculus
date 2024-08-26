"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup from "@/components/ui/button_group";
import Listbox from "@/components/ui/listbox";
import useSearchParams from "@/hooks/use_search_params";
import { LeaderboardFilters } from "@/types/scoring";

import { RANKING_CATEGORIES } from "../../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";
import { LEADERBOARD_YEAR_OPTIONS } from "../filters";

type Props = {
  filters: LeaderboardFilters;
};

const LeaderboardHeader: FC<Props> = ({ filters }) => {
  const t = useTranslations();
  const { setParam, navigateToSearchParams } = useSearchParams();

  const { category, durations, duration, periods, year } = filters;

  const handleDurationChange = (value: string) => {
    const withNavigation = false;
    setParam(SCORING_CATEGORY_FILTER, category, withNavigation);
    setParam(SCORING_YEAR_FILTER, nextValidYear(year, value), withNavigation);
    setParam(SCORING_DURATION_FILTER, value, withNavigation);
    navigateToSearchParams();
  };
  const handlePeriodChange = (value: string) => {
    const withNavigation = false;
    setParam(SCORING_CATEGORY_FILTER, category, withNavigation);
    setParam(SCORING_YEAR_FILTER, value, withNavigation);
    setParam(SCORING_DURATION_FILTER, duration, withNavigation);
    navigateToSearchParams();
  };

  return (
    <section className="text-metac-blue-800 dark:text-metac-blue-800-dark flex w-full flex-col items-center gap-3.5 max-sm:pt-3 sm:m-8 sm:mb-6 sm:gap-6">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col items-center justify-center gap-3">
          {category !== "all" && (
            <Link
              href={`?year=${year}&duration=${duration}`}
              className="text-metac-blue-700 dark:text-metac-blue-700-dark text-base leading-5"
            >
              {t("leaderboards")}
            </Link>
          )}
          <div className="text-metac-blue-900 dark:text-metac-blue-900-dark text-2xl font-bold sm:text-4xl">
            {category !== "all" ? (
              <div className="flex items-center gap-4">
                <span>{t(RANKING_CATEGORIES[category].translationKey)}</span>
              </div>
            ) : (
              <span>{t("leaderboards")}</span>
            )}
          </div>
        </div>
        <div className="text-metac-gray-700 dark:text-metac-gray-700-dark max-w-3xl px-5 py-2 text-center text-sm font-normal sm:py-0 sm:text-base">
          {RANKING_CATEGORIES[category].explanation}
        </div>
      </div>
      <div className="flex flex-col gap-3 max-sm:hidden">
        {/* comments and questionWriting leaderboards only exist for 1-year durations, so no selector is shown */}
        {durations &&
          duration &&
          ["all", "peer", "baseline"].includes(category) && (
            <div className="flex flex-row items-center justify-center gap-2.5">
              <span className="text-base font-medium">{t("duration:")}</span>
              <ButtonGroup
                buttons={durations}
                value={duration}
                onChange={handleDurationChange}
                variant="tertiary"
              />
            </div>
          )}
        {periods && year && (
          <div className="flex flex-row items-center justify-center gap-2.5">
            <span className="text-base font-medium">{t("timePeriod")}</span>
            <ButtonGroup
              buttons={periods}
              value={year}
              onChange={handlePeriodChange}
              variant="tertiary"
            />
          </div>
        )}
      </div>
      <div className="dark:text-metac-blue-600-dark flex justify-center gap-5 font-medium leading-6 sm:hidden">
        {/* comments and questionWriting leaderboards only exist for 1-year durations, so no selector is shown */}
        {durations &&
          duration &&
          ["all", "peer", "baseline"].includes(category) && (
            <div className="flex items-center gap-2.5">
              <span className="text-metac-blue-800 dark:text-metac-blue-800-dark text-base font-medium">
                {t("duration:")}
              </span>
              <Listbox
                value={duration}
                onChange={handleDurationChange}
                options={durations}
                buttonVariant="tertiary"
                arrowPosition="right"
              />
            </div>
          )}
        {periods && year && (
          <div className="flex items-center gap-2.5">
            <span className="text-metac-blue-800 dark:text-metac-blue-800-dark text-base font-medium">
              {t("timePeriod")}
            </span>
            <Listbox
              value={year}
              onChange={handlePeriodChange}
              options={periods}
              buttonVariant="tertiary"
              arrowPosition="right"
            />
          </div>
        )}
      </div>
    </section>
  );
};

function nextValidYear(year: string, selectedDuration: string) {
  const matchingYears = LEADERBOARD_YEAR_OPTIONS.filter(
    (opt) => opt.duration === selectedDuration
  )
    .map((opt) => Number(opt.year))
    .sort((a, b) => b - a);
  const greaterYears = matchingYears.filter((opt) => opt >= Number(year));

  if (greaterYears.length === 0) {
    return matchingYears.length > 0 ? String(matchingYears[0]) : year;
  }

  const nextValidYear = greaterYears.reduce((closest, current) => {
    return current - Number(year) < closest - Number(year) ? current : closest;
  });
  return String(nextValidYear);
}

export default LeaderboardHeader;

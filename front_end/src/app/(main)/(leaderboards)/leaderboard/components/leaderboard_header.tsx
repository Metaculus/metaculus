"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ButtonGroup from "@/components/ui/button_group";
import Listbox from "@/components/ui/listbox";
import useSearchParams from "@/hooks/use_search_params";
import { LeaderboardTag } from "@/types/projects";
import { LeaderboardFilters } from "@/types/scoring";
import {
  buildLeaderboardTagSlug,
  getLeaderboardTagFeedUrl,
} from "@/utils/navigation";

import { RANKING_CATEGORIES } from "../../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";
import { LEADERBOARD_YEAR_OPTIONS } from "../filters";

type Props = {
  filters: LeaderboardFilters;
  leaderboardTags: LeaderboardTag[];
};

const LeaderboardHeader: FC<Props> = ({ filters, leaderboardTags }) => {
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
  const leaderboardTag = leaderboardTags.find(
    (obj) =>
      obj.slug === buildLeaderboardTagSlug(Number(year), Number(duration))
  );

  return (
    <section className="flex w-full flex-col items-center gap-3.5 text-blue-800 dark:text-blue-800-dark max-sm:pt-3 sm:m-8 sm:mb-6 sm:gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center gap-3">
          {category !== "all" && (
            <Link
              href={`?year=${year}&duration=${duration}`}
              className="text-base leading-5 text-blue-700 dark:text-blue-700-dark"
            >
              {t("leaderboards")}
            </Link>
          )}
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-4xl">
            {category !== "all" ? (
              <div className="flex items-center gap-4">
                <span>{t(RANKING_CATEGORIES[category].translationKey)}</span>
              </div>
            ) : (
              <span>{t("leaderboards")}</span>
            )}
          </div>
        </div>
        <div className="max-w-3xl px-5 py-2 text-center text-sm font-normal text-gray-700 dark:text-gray-700-dark sm:py-0">
          {RANKING_CATEGORIES[category].explanation}
        </div>
      </div>
      <div className="flex flex-col gap-3 max-sm:hidden">
        {/* comments and questionWriting leaderboards only exist for 1-year durations, so no selector is shown */}
        {durations &&
          duration &&
          ["all", "peer", "baseline"].includes(category) && (
            <div className="flex flex-col items-center justify-center gap-2.5 md:flex-row">
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
          <div className="flex flex-col items-center justify-center gap-2.5 md:flex-row">
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
      <div className="flex justify-center gap-5 font-medium leading-6 dark:text-blue-600-dark sm:hidden">
        {/* comments and questionWriting leaderboards only exist for 1-year durations, so no selector is shown */}
        {durations &&
          duration &&
          ["all", "peer", "baseline"].includes(category) && (
            <div className="flex items-center gap-2.5">
              <span className="text-base font-medium text-blue-800 dark:text-blue-800-dark">
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
            <span className="text-base font-medium text-blue-800 dark:text-blue-800-dark">
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
      <div className="flex flex-col gap-3">
        {Number(year) + Number(duration) > 2025 && (
          <div className="max-w-3xl px-5 py-2 text-center text-xs font-normal text-gray-700 dark:text-gray-700-dark sm:py-0">
            {t("liveLeaderboardDisclaimer")}
          </div>
        )}
        {category === "peer" && Number(year) + Number(duration) <= 2024 && (
          <div className="max-w-3xl px-5 py-2 text-center text-xs font-normal text-gray-700 dark:text-gray-700-dark sm:py-0">
            {t.rich("legacyPeerDisclaimer", {
              link: (chunks) => (
                <Link href="/help/medals-faq/#peer-medals">{chunks}</Link>
              ),
            })}
          </div>
        )}
        {leaderboardTag && (
          <div className="max-w-3xl px-5 py-2 text-center text-xs font-normal text-gray-700 dark:text-gray-700-dark sm:py-0">
            {t.rich("LeaderboardTagDisclaimer", {
              link: (obj) => (
                <Link href={getLeaderboardTagFeedUrl(leaderboardTag)}>
                  {obj}
                </Link>
              ),
            })}
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

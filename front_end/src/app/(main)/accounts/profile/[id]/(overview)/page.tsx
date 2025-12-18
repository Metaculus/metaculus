import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import MedalIcon from "@/app/(main)/(leaderboards)/components/medal_icon";
import MedalRankInfoTooltip from "@/app/(main)/(leaderboards)/medals/components/medal_rank_info_tooltip";
import { getMedalCategories } from "@/app/(main)/(leaderboards)/medals/helpers/medal_categories";
import { RANKING_CATEGORIES } from "@/app/(main)/(leaderboards)/ranking_categories";
import CalibrationChart from "@/app/(main)/questions/track-record/components/charts/calibration_chart";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { MedalCategory, MedalProjectType, MedalType } from "@/types/scoring";
import cn from "@/utils/core/cn";
import { formatUsername } from "@/utils/formatters/users";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

type StatsEntry = {
  header: string;
  value?: string | number;
  footer: string;
};

const PerformanceCard: FC<{
  medalCategory: MedalCategory;
  stats: StatsEntry[];
  className?: string;
}> = ({ medalCategory, stats, className }) => {
  const t = useTranslations();

  const medalsWithCount: { type: string; count: number }[] = [
    "gold",
    "silver",
    "bronze",
  ].map((type) => ({
    type,
    count: medalCategory.medals.filter((m) => m.type === type).length,
  }));

  const noMedals = medalCategory.medals.length < 1;

  if (noMedals) {
    return (
      <div
        className={cn(
          "flex flex-row items-center justify-between gap-2 rounded bg-blue-100 p-3 dark:bg-blue-100-dark sm:flex-col md:justify-center md:p-5",
          className
        )}
      >
        <span className="text-nowrap text-sm text-gray-700 dark:text-gray-700-dark md:text-lg">
          {t(RANKING_CATEGORIES[medalCategory.name].translationKey)}
        </span>

        <span className="text-gray-500 dark:text-gray-500-dark">
          {t("noMedals")}
        </span>
      </div>
    );
  }

  return (
    <Link href={`?mode=medals`} className={cn("no-underline", className)}>
      <div
        className={cn(
          "flex flex-col items-center gap-5 rounded  bg-blue-200 p-4 dark:bg-blue-200-dark",
          noMedals && "bg-blue-100 dark:bg-blue-100-dark"
        )}
      >
        {/* Medals */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-nowrap text-lg text-gray-700 dark:text-gray-700-dark">
            {t(RANKING_CATEGORIES[medalCategory.name].translationKey)}
          </span>

          <div className="flex justify-center gap-4">
            {medalsWithCount.map(
              ({ type, count }) =>
                count > 0 && (
                  <div className="flex gap-2" key={type}>
                    <MedalIcon type={type as MedalType} className="size-6" />
                    <span className="text-base font-bold leading-6">
                      {count}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6">
          {stats
            .filter(({ value }) => !!value)
            .map((stat) => (
              <div
                className="flex flex-col items-center gap-1"
                key={stat.header}
              >
                <span className="text-xs uppercase text-gray-500 dark:text-gray-500-dark">
                  {stat.header}
                </span>
                <div className="flex flex-row justify-center gap-1">
                  <span className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
                    {stat.value}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-500-dark">
                    {stat.footer}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Link>
  );
};

export default async function MedalsPage(props: Props) {
  const params = await props.params;
  const profile = await ServerProfileApi.getProfileById(params.id);

  const t = await getTranslations();
  const [userMedals, userMedalRanks] = await Promise.all([
    ServerLeaderboardApi.getUserMedals(params.id),
    ServerLeaderboardApi.getUserMedalRanks(params.id),
  ]);
  const categories = getMedalCategories(userMedals, true);

  const [
    tournamentMedals,
    baselineMedals,
    peerMedals,
    commentsMedals,
    questionsMedals,
  ] = ["tournament", "baseline", "peer", "comments", "questionWriting"].map(
    (name) =>
      categories.find((c) => c.name === name) ??
      ({
        name: "tournament",
        medals: [],
      } as MedalCategory)
  );

  const tournamentRanks = userMedalRanks.find(
    (r) => r.type === "tournaments_global"
  );
  const baselineRanks = userMedalRanks.find(
    (r) => r.type === "baseline_global"
  );
  const peerRanks = userMedalRanks.find((r) => r.type === "peer_global");
  const commentsRanks = userMedalRanks.find(
    (r) => r.type === "comments_global"
  );
  const questionsRanks = userMedalRanks.find(
    (r) => r.type === "questions_global"
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const total_prizes = userMedals
    .filter((medal) => medal.project_type === MedalProjectType.Tournament)
    .map((medal) => Math.round(medal.prize ?? 0))
    .reduce((acc, prize) => acc + prize, 0);

  const tournamentStats: StatsEntry[] = [
    {
      header: t("currentRank"),
      value: tournamentRanks?.rank,
      footer: `of ${tournamentRanks?.rank_total}`,
    },
    {
      header: t("bestEver"),
      value: tournamentRanks?.best_rank,
      footer: `of ${tournamentRanks?.best_rank_total}`,
    },
    // TODO: uncomment when issue with total prizes will be fixed
    // {
    //   header: t("totalPrizes"),
    //   value: `$${total_prizes}`,
    //   footer: t("totalEarned"),
    // },
  ];

  const baselineStats: StatsEntry[] = [
    {
      header: t("currentRank"),
      value: baselineRanks?.rank,
      footer: `of ${baselineRanks?.rank_total}`,
    },
    {
      header: t("bestEver"),
      value: baselineRanks?.best_rank,
      footer: `of ${baselineRanks?.best_rank_total}`,
    },
  ];

  const peerStats: StatsEntry[] = [
    {
      header: t("currentRank"),
      value: peerRanks?.rank,
      footer: `of ${peerRanks?.rank_total}`,
    },
    {
      header: t("bestEver"),
      value: peerRanks?.best_rank,
      footer: `of ${peerRanks?.best_rank_total}`,
    },
  ];

  const commentsStats: StatsEntry[] = [
    {
      header: t("currentRank"),
      value: commentsRanks?.rank,
      footer: `of ${commentsRanks?.rank_total}`,
    },
    {
      header: t("bestEver"),
      value: commentsRanks?.best_rank,
      footer: `of ${commentsRanks?.best_rank_total}`,
    },
  ];

  const questionsStats: StatsEntry[] = [
    {
      header: t("currentRank"),
      value: questionsRanks?.rank,
      footer: `of ${questionsRanks?.rank_total}`,
    },
    {
      header: t("bestEver"),
      value: questionsRanks?.best_rank,
      footer: `of ${questionsRanks?.best_rank_total}`,
    },
  ];

  return (
    <>
      <section className="flex flex-col gap-4 rounded md:gap-6 lg:flex-row">
        {/* Forecasting Performance */}
        <div className="flex flex-col items-stretch gap-5 bg-white p-4 dark:bg-blue-900 md:p-6 lg:grow-[2]">
          <div className="flex items-center justify-between">
            <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
              {t("forecastingPerformance")}
            </h3>
            <MedalRankInfoTooltip />
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Tournaments */}
            <div className="flex-1">
              <PerformanceCard
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                medalCategory={tournamentMedals!}
                stats={tournamentStats}
              />
            </div>

            {/* Baseline and Peer */}
            <div className="flex w-full flex-1 flex-col gap-3 sm:gap-4 md:flex-row">
              <PerformanceCard
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                medalCategory={baselineMedals!}
                stats={baselineStats}
                className="flex-1 grow"
              />
              <PerformanceCard
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                medalCategory={peerMedals!}
                stats={peerStats}
                className="flex-1 grow"
              />
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="flex flex-col items-stretch gap-5 bg-white p-4 dark:bg-blue-900 md:p-6 lg:grow-[1]">
          <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
            {t("insight")}
          </h3>
          <div className="flex grow flex-col gap-3 sm:gap-4 md:max-lg:flex-row">
            <PerformanceCard
              /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
              medalCategory={commentsMedals!}
              stats={commentsStats}
              className="flex-1 grow"
            />
            <PerformanceCard
              /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
              medalCategory={questionsMedals!}
              stats={questionsStats}
              className="flex-1 grow"
            />
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-4 rounded bg-white p-4 dark:bg-blue-900 md:p-6">
        {profile.calibration_curve && (
          <CalibrationChart
            calibrationData={profile.calibration_curve}
            username={formatUsername(profile)}
          />
        )}
      </section>
    </>
  );
}

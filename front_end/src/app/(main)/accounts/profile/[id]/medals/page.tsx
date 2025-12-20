import Link from "next/link";
import { getTranslations } from "next-intl/server";

import MedalIcon from "@/app/(main)/(leaderboards)/components/medal_icon";
import { getMedalCategories } from "@/app/(main)/(leaderboards)/medals/helpers/medal_categories";
import { getMedalDisplayTitle } from "@/app/(main)/(leaderboards)/medals/helpers/medal_title";
import { RANKING_CATEGORIES } from "@/app/(main)/(leaderboards)/ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "@/app/(main)/(leaderboards)/search_params";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { SearchParams } from "@/types/navigation";
import cn from "@/utils/core/cn";

type Props = {
  params: Promise<{ id: number }>;
  searchParams: Promise<SearchParams>;
};

export default async function MedalsPage(props: Props) {
  const t = await getTranslations();
  const params = await props.params;

  const userMedals = await ServerLeaderboardApi.getUserMedals(params.id);
  const categories = getMedalCategories(userMedals, true);
  type MedalType = "gold" | "silver" | "bronze";

  function getMedalClassName(medalType: MedalType): string {
    switch (medalType) {
      case "gold":
        return "bg-blue-700/5 dark:bg-blue-950 md:bg-white md:bg-gradient-to-b from-[#F6D84D]/0 dark:from-blue-950 dark:to-blue-950 md:from-[#F6D84D]/30 dark:md:from-[#F6D84D]/20 from-0% to-30% to-white md:dark:to-blue-950/75";
      case "silver":
        return "bg-blue-700/5 dark:bg-blue-950 md:bg-white md:bg-gradient-to-b from-[#A7B1C0]/0 dark:from-blue-950 dark:to-blue-950 md:from-[#A7B1C0]/15 dark:md:from-[#A7B1C0]/15 dark:from-[#A7B1C0]/25 from-0% to-30% to-white md:dark:to-blue-950/75";
      case "bronze":
        return "bg-blue-700/5 dark:bg-blue-950 md:bg-white md:bg-gradient-to-b from-[#F09B59]/0 dark:from-blue-950 dark:to-blue-950 md:from-[#F09B59]/20 dark:md:from-[#F09B59]/20 from-0% to-30% to-white md:dark:to-blue-950/75";
      default:
        return "";
    }
  }
  return (
    <section>
      <div className="flex w-full flex-col items-center gap-4">
        {categories?.map((category, index) => (
          <div
            key={index}
            className={cn(
              "flex w-full flex-col items-center justify-center rounded ",
              { "sm:col-span-2": category.name === "tournament" }
            )}
          >
            <div className="flex w-full items-center justify-center gap-3 self-stretch rounded-t bg-gradient-to-b from-white to-blue-100 px-5 py-2.5 pb-2 dark:from-blue-900/75 dark:to-blue-900/75 md:py-4 md:pb-4">
              <span className="lext-lg font-medium text-blue-800 dark:text-blue-200 md:text-xl">
                {t(RANKING_CATEGORIES[category.name].translationKey)}
              </span>
            </div>
            <div className="flex min-h-[65px] flex-col content-center items-center justify-center gap-3 self-stretch rounded-b bg-blue-100 p-4 pt-0 dark:bg-blue-900/75 md:flex-row md:flex-wrap md:pt-4">
              {!!category.medals.length ? (
                category.medals.map((medal, index) => {
                  const href =
                    category.name === "tournament"
                      ? `/tournament/${medal.projectSlug}`
                      : `/leaderboard/?${SCORING_CATEGORY_FILTER}=${category.name}&${SCORING_YEAR_FILTER}=${medal.year}&${SCORING_DURATION_FILTER}=${medal.duration}`;

                  return (
                    <Link
                      href={href}
                      key={index}
                      className={`relative flex w-full min-w-[210px] flex-row items-center gap-3 overflow-hidden rounded-lg px-3 py-3 shadow-none shadow-blue-500/30 dark:bg-blue-900 dark:shadow-black/25 md:w-fit md:flex-col md:px-8 md:py-4 md:shadow-lg ${getMedalClassName(medal.type)}`}
                    >
                      <div className="z-2 absolute left-[-64px] top-[-40px] hidden size-32 rounded-full bg-white blur-xl dark:bg-blue-950 md:block"></div>
                      <div className="z-2 absolute right-[-64px] top-[-40px] hidden size-32 rounded-full bg-white blur-xl dark:bg-blue-950 md:block"></div>
                      <div className="z-5 relative min-w-6">
                        <MedalIcon
                          type={medal.type}
                          className="size-6 md:size-8 "
                        />
                      </div>
                      <div className="z-5 relative flex w-full flex-row items-start justify-between gap-2 md:flex-col md:items-center">
                        <span className="self-center text-base font-bold text-gray-800 dark:text-gray-200">
                          {getMedalDisplayTitle(medal)}
                        </span>
                        <span className="w-min self-center text-center text-sm text-gray-700 dark:text-gray-300 md:w-fit">
                          <span className="opacity-70">{t("rank")}: </span>
                          <span className="font-bold">#{medal.rank}</span>{" "}
                          <span className="hidden opacity-70 md:inline-block">
                            {t("outOfRank", { total: medal.totalEntries })}
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <span className="text-base text-gray-500 dark:text-gray-500-dark">
                  {t("noMedals")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

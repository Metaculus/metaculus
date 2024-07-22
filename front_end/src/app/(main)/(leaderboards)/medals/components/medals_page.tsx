import classNames from "classnames";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";
import LeaderboardApi from "@/services/leaderboard";

import MedalIcon from "../../components/medal_icon";
import { RANKING_CATEGORIES } from "../../ranking_categories";
import { SCORING_CATEGORY_FILTER } from "../../search_params";
import { getMedalCategories } from "../helpers/medal_categories";
import { getMedalDisplayTitle } from "../helpers/medal_title";

type Props = {
  profileId: number;
};

const MedalsPage: FC<Props> = async ({ profileId }) => {
  const t = await getTranslations();

  const userMedals = await LeaderboardApi.getUserMedals(profileId);
  const categories = getMedalCategories(userMedals, true);
  type MedalType = "gold" | "silver" | "bronze";

  function getMedalClassName(medalType: MedalType): string {
    switch (medalType) {
      case "gold":
        return "border-yellow-500 dark:border-yellow-500/50 shadow-yellow-500/15 dark:shadow-yellow-500/10";
      case "silver":
        return "border-gray-500/50 shadow-gray-500/15 dark:shadow-gray-500/8";
      case "bronze":
        return "border-orange-600/50 shadow-orange-500/15 dark:shadow-orange-500/8";
      default:
        return "";
    }
  }
  return (
    <section>
      <div className="flex w-full flex-col items-center gap-3">
        {categories?.map((category, index) => (
          <div
            key={index}
            className={classNames(
              "flex w-full flex-col items-center justify-center rounded border border-gray-300 dark:border-gray-300-dark",
              { "sm:col-span-2": category.name === "tournament" }
            )}
          >
            <div className="flex w-full items-center justify-center gap-3 self-stretch rounded-t bg-white px-5 py-4 dark:bg-blue-950">
              <span className="text-xl font-medium text-blue-800 dark:text-blue-800-dark">
                {t(RANKING_CATEGORIES[category.name].translationKey)}
              </span>
            </div>
            <div className="flex min-h-[65px] flex-col content-center items-center justify-center gap-3 self-stretch rounded-b border-t border-gray-300 bg-blue-100 p-4 dark:border-gray-300-dark dark:bg-blue-100-dark  md:flex-row md:flex-wrap">
              {!!category.medals.length ? (
                category.medals.map((medal, index) => {
                  return (
                    <div
                      key={index}
                      className={`flex w-full flex-row items-center gap-3 rounded-lg border bg-white px-3 py-3 shadow-xl dark:bg-blue-950 md:w-fit md:flex-col md:px-8 md:py-4 ${getMedalClassName(medal.type)}`}
                    >
                      <div className="min-w-6">
                        <MedalIcon
                          type={medal.type}
                          className="size-6 md:size-8"
                        />
                      </div>
                      <div className="flex w-full flex-row items-start justify-between gap-2 md:flex-col md:items-center">
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
                    </div>
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
};

export default MedalsPage;

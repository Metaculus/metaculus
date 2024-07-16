import classNames from "classnames";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";
import LeaderboardApi from "@/services/leaderboard";

import MedalIcon from "../../components/medal_icon";
import { LEADERBOARD_CATEGORY_FILTER } from "../../leaderboard/filters";
import { RANKING_CATEGORIES } from "../../ranking_categories";
import { getMedalCategories } from "../helpers/medal_categories";
import { getMedalDisplayTitle } from "../helpers/medal_title";

type Props = {
  profileId: number;
};

const MedalsWidget: FC<Props> = async ({ profileId }) => {
  const t = await getTranslations();

  const userMedals = await LeaderboardApi.getUserMedals(profileId);
  const categories = getMedalCategories(userMedals, true);

  return (
    <section className="border-y border-gray-500 pb-6 dark:border-gray-500-dark">
      <h2 className="mb-5">{t("medals")}</h2>
      <div className="grid grid-cols-1 items-center gap-3 self-stretch sm:grid-cols-2">
        {categories?.map((category, index) => (
          <div
            key={index}
            className={classNames(
              "flex flex-col items-center justify-center rounded border border-gray-300 dark:border-gray-300-dark",
              { "sm:col-span-2": category.name === "tournament" }
            )}
          >
            <Link
              href={
                category.name === "tournament"
                  ? "/tournaments"
                  : `/leaderboard/?${LEADERBOARD_CATEGORY_FILTER}=${category.name}`
              }
              className="flex items-center justify-center gap-3 self-stretch px-5 py-4 text-lg font-medium text-blue-800 no-underline dark:text-blue-800-dark"
            >
              <span>{t(RANKING_CATEGORIES[category.name].translationKey)}</span>
            </Link>
            <div className="flex min-h-[65px] flex-wrap content-center items-center justify-center gap-[13px] self-stretch border-t border-gray-300 bg-blue-100 p-4 dark:border-gray-300-dark dark:bg-blue-100-dark">
              {!!category.medals.length ? (
                category.medals.map((medal, index) => {
                  const TooltipContent = (
                    <div className="flex flex-col items-center self-stretch">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-800-dark">
                        {getMedalDisplayTitle(medal)}
                      </span>
                      <span className="text-base text-gray-700 dark:text-gray-700-dark">
                        {t("rank")}:{" "}
                        <span className="font-bold">#{medal.rank}</span>{" "}
                        {t("outOfRank", { total: medal.totalEntries })}
                      </span>
                    </div>
                  );

                  return (
                    <Tooltip
                      showDelayMs={200}
                      placement={"bottom"}
                      TooltipContent={TooltipContent}
                      key={index}
                    >
                      <a href={`/medals?user=${profileId}`}>
                        <MedalIcon type={medal.type} className="size-8" />
                      </a>
                    </Tooltip>
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

export default MedalsWidget;

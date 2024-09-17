import classNames from "classnames";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Tooltip from "@/components/ui/tooltip";
import LeaderboardApi from "@/services/leaderboard";

import MedalIcon from "../../components/medal_icon";
import { RANKING_CATEGORIES } from "../../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";
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
    <section className="rounded bg-white p-4 dark:bg-blue-900 md:p-6">
      <div className="mb-5 flex w-full flex-row items-center justify-between">
        <h3 className="my-0 py-0 text-gray-700 dark:text-gray-300">
          {t("medals")}
        </h3>
        <a
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          href={`/accounts/profile/${profileId}?mode=medals`}
        >
          View All
        </a>
      </div>
      <div className="flex w-full flex-col items-center gap-2 md:gap-3">
        {categories?.map((category, index) => (
          <div
            key={index}
            className={classNames(
              "flex w-full flex-col items-center justify-center rounded  bg-blue-100 dark:bg-blue-950/50",
              { "sm:col-span-2": category.name === "tournament" }
            )}
          >
            <Link
              href={`/accounts/profile/${profileId}?mode=medals`}
              className="flex w-full items-center justify-center gap-3 self-stretch px-5 py-1.5 text-base font-medium text-blue-800 no-underline dark:text-blue-800-dark md:py-3 md:text-lg"
            >
              <span>{t(RANKING_CATEGORIES[category.name].translationKey)}</span>
            </Link>
            <div className="flex flex-wrap content-center items-center justify-center gap-[8px] self-stretch rounded-b bg-blue-200 px-3 py-2 dark:bg-blue-100-dark md:gap-[13px] md:py-3">
              {!!category.medals.length ? (
                category.medals.map((medal, index) => {
                  const tooltipContent = (
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
                  const href =
                    category.name === "tournament"
                      ? `/tournament/${medal.projectSlug}`
                      : `/leaderboard/?${SCORING_CATEGORY_FILTER}=${category.name}&${SCORING_YEAR_FILTER}=${medal.year}&${SCORING_DURATION_FILTER}=${medal.duration}`;

                  return (
                    <Tooltip
                      showDelayMs={200}
                      placement={"bottom"}
                      tooltipContent={tooltipContent}
                      key={index}
                    >
                      <Link href={href}>
                        <MedalIcon type={medal.type} className="size-6" />
                      </Link>
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

export default WithServerComponentErrorBoundary(MedalsWidget);

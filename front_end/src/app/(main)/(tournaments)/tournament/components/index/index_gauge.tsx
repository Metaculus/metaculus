import { isNil } from "lodash";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import RichText from "@/components/rich_text";
import WeeklyMovement from "@/components/weekly_movement";
import { Tournament } from "@/types/projects";

import { calculateIndex } from "./helpers";

type Props = {
  tournament: Tournament;
};

const IndexGauge: FC<Props> = async ({ tournament }) => {
  const t = await getTranslations();
  const indexWeights = tournament.index_weights;
  if (isNil(indexWeights)) {
    return null;
  }
  const { index: indexValue, indexWeekAgo } = calculateIndex(indexWeights);
  const indexWeeklyMovement = Number((indexValue - indexWeekAgo).toFixed(1));

  return (
    <div className="mb-12 mt-4 flex flex-col gap-1.5 sm:mb-9 sm:mt-6 sm:gap-2">
      {/* Index numbers scale */}
      <div className="relative flex justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-500-dark">
          -100
        </span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-medium text-gray-500 dark:text-gray-500-dark">
          0
        </span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-500-dark">
          +100
        </span>
      </div>

      {/* Index gauge */}
      <div className="relative flex h-2 justify-between bg-blue-400 dark:bg-blue-400-dark">
        <div className="h-full w-[3px] bg-blue-700 dark:bg-blue-700-dark    " />
        <div className="h-full w-[3px] bg-blue-700 dark:bg-blue-700-dark" />
        <div className="h-full w-[3px] bg-blue-700 dark:bg-blue-700-dark" />
        {/* Index chip */}
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-3 flex-col items-center text-sm font-medium leading-6 text-gray-500 dark:text-gray-500-dark"
          style={{
            left: `${50 + indexValue / 2}%`, // Convert -100 to 100 range into 0% to 100%
          }}
        >
          <span className="bg-gray-0 px-1.5 py-0.5 text-base font-bold text-blue-700 dark:bg-gray-0-dark dark:text-blue-700-dark">
            {indexValue.toFixed(1)}
          </span>
          <span className="-mt-1">{t("indexValue")}</span>
          <WeeklyMovement
            weeklyMovement={indexWeeklyMovement}
            message={
              indexWeeklyMovement === 0 ? (
                t("weeklyMovementChange", {
                  value: t("noChange"),
                })
              ) : (
                <RichText>
                  {(tags) =>
                    t.rich("indexWeeklyMovement", {
                      ...tags,
                      value: Math.abs(indexWeeklyMovement),
                    })
                  }
                </RichText>
              )
            }
            className="text-xs"
            iconClassName="text-xs font-bold"
          />
        </div>
      </div>
    </div>
  );
};

export default IndexGauge;

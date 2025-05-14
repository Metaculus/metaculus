import "./styles.css";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { ProjectIndexWeights, Tournament } from "@/types/projects";
import { formatDate } from "@/utils/formatters/date";

import { calculateIndex } from "./helpers";
import IndexQuestionsTable from "./index_questions_table";
import IndexTimeline from "./index_timeline";

type Props = {
  indexWeights: ProjectIndexWeights[];
  tournament: Tournament;
};

const IndexSection: FC<Props> = ({ indexWeights, tournament }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { index: indexValue, indexWeekAgo } = calculateIndex(indexWeights);
  const indexWeeklyMovement = Number((indexValue - indexWeekAgo).toFixed(1));
  console.log(indexWeights);
  return (
    <>
      <IndexQuestionsTable
        indexWeights={indexWeights}
        showWeeklyMovement={indexWeeklyMovement !== 0}
        HeadingSection={
          <div className="flex flex-col items-center border-b border-gray-300 bg-gray-0 px-4 py-4 text-center leading-4 dark:border-gray-300-dark dark:bg-gray-0-dark">
            <IndexTimeline tournament={tournament} />
          </div>
        }
      />
      <SectionToggle
        defaultOpen={true}
        title={t("metadata")}
        wrapperClassName="mt-6"
        variant="dark"
      >
        <div className="flex flex-wrap gap-x-8 gap-y-4 bg-gray-0 p-6 dark:bg-gray-0-dark">
          {!isNil(tournament.prize_pool) && (
            <IndexStat
              title={t("prizePool")}
              text={"$" + Number(tournament.prize_pool).toLocaleString()}
            />
          )}
          <IndexStat
            title={t("StartDate")}
            text={formatDate(locale, new Date(tournament.start_date))}
          />
          {!isNil(tournament.close_date) && (
            <IndexStat
              title={t("EndDate")}
              text={formatDate(locale, new Date(tournament.close_date))}
            />
          )}
        </div>
      </SectionToggle>
    </>
  );
};

const IndexStat: FC<{ title: string; text: string }> = ({ text, title }) => (
  <div className="flex flex-col text-blue-800 dark:text-blue-800-dark">
    <span className="text-sm font-normal capitalize leading-5 opacity-50">
      {title}
    </span>
    <span className="text-lg font-medium leading-7">{text}</span>
  </div>
);

export default IndexSection;

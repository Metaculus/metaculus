import { isNil } from "lodash";
import { getLocale, getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";

import { Tournament, TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/formatters/date";

import TournamentTimeline from "../components/tournament_timeline";
import IndexHeaderBlock from "./index/index_header_block";

type Props = {
  tournament: Tournament;
};

const HeaderBlockInfo: FC<Props> = async ({ tournament }) => {
  const t = await getTranslations();
  const locale = await getLocale();

  switch (tournament.type) {
    case TournamentType.Tournament:
      return (
        <Suspense fallback={<Skeleton />}>
          <TournamentTimeline tournament={tournament} />
        </Suspense>
      );
    case TournamentType.Index:
      return (
        <Suspense fallback={<Skeleton />}>
          <IndexHeaderBlock tournament={tournament}>
            <TournamentTimeline tournament={tournament} />
          </IndexHeaderBlock>
        </Suspense>
      );
    default:
      return (
        <div className="flex flex-wrap gap-x-9 gap-y-4 py-4">
          {!isNil(tournament.prize_pool) && (
            <TournamentStat
              title={t("prizePool")}
              text={"$" + Number(tournament.prize_pool).toLocaleString()}
            />
          )}
          {!isNil(tournament.start_date) && (
            <TournamentStat
              title={t("StartDate")}
              text={formatDate(locale, new Date(tournament.start_date))}
            />
          )}
          {!isNil(tournament.close_date) && (
            <TournamentStat
              title={t("EndDate")}
              text={formatDate(locale, new Date(tournament.close_date))}
            />
          )}
        </div>
      );
  }
};

const TournamentStat: FC<{ title: string; text: string }> = ({
  text,
  title,
}) => (
  <div className="flex flex-col text-blue-800 dark:text-blue-800-dark">
    <span className="text-sm font-normal capitalize leading-5 opacity-50">
      {title}
    </span>
    <span className="text-xl font-bold leading-6">{text}</span>
  </div>
);

const Skeleton: FC = () => {
  return (
    <div className="mt-4 flex min-h-20 flex-col gap-x-5 gap-y-4 sm:mt-5 sm:flex-row">
      <div className="flex flex-1 animate-pulse flex-col justify-between">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="my-3 h-1 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="flex max-h-20 animate-pulse items-center justify-center rounded bg-gray-200 py-1.5 dark:bg-gray-700 sm:w-[200px] sm:flex-col sm:py-3">
        <div className="h-6 w-24 rounded bg-gray-300 dark:bg-gray-600 sm:h-8 sm:w-32" />
      </div>
    </div>
  );
};

export default HeaderBlockInfo;

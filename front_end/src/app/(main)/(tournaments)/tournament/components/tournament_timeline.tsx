import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";
import { Tournament } from "@/types/projects";
import { LeaderboardDetails } from "@/types/scoring";
import { logError } from "@/utils/core/errors";

import ActiveTournamentTimeline from "./active_tournament_timeline";
import ClosedTournamentTimeline from "./closed_tournament_timeline";

type Props = {
  tournament: Tournament;
};

const TournamentTimeline: FC<Props> = async ({ tournament }) => {
  const t = await getTranslations();
  const locale = await getLocale();

  let leaderboardDetails: LeaderboardDetails | null = null;
  try {
    leaderboardDetails = await ServerLeaderboardApi.getProjectLeaderboard(
      tournament.id
    );
  } catch (error) {
    logError(error);
  }
  const showLastParticipationDay =
    leaderboardDetails &&
    (leaderboardDetails.score_type === "spot_peer_tournament" ||
      leaderboardDetails.score_type === "spot_baseline_tournament");

  const {
    last_cp_reveal_time,
    latest_scheduled_resolve_time,
    latest_actual_resolve_time,
    all_questions_resolved,
    all_questions_closed,
  } = tournament.timeline;

  return (
    <div className="mt-4 flex flex-col gap-x-5 gap-y-4 sm:mt-5 sm:flex-row">
      {!all_questions_closed ? (
        <ActiveTournamentTimeline
          tournament={tournament}
          lastParticipationDayTimestamp={
            showLastParticipationDay
              ? getTimestampFromDateString(last_cp_reveal_time)
              : null
          }
          latestScheduledCloseTimestamp={getTimestampFromDateString(
            tournament.forecasting_end_date || tournament.close_date
          )}
        />
      ) : (
        <ClosedTournamentTimeline
          tournament={tournament}
          latestScheduledResolutionTimestamp={getTimestampFromDateString(
            latest_scheduled_resolve_time
          )}
          latestActualCloseTimestamp={getTimestampFromDateString(
            tournament.forecasting_end_date || tournament.close_date
          )}
          isAllQuestionsResolved={all_questions_resolved}
          latestActualResolutionTimestamp={getTimestampFromDateString(
            latest_actual_resolve_time
          )}
        />
      )}
      {tournament.prize_pool && (
        <div className="flex max-h-[74px] items-center justify-center gap-x-1.5 gap-y-0.5 rounded bg-olive-300 py-1.5 dark:bg-olive-300-dark sm:w-[200px] sm:flex-col sm:py-3">
          <span className="text-base font-medium text-olive-900 dark:text-olive-900-dark sm:text-xl">
            ${Number(tournament.prize_pool).toLocaleString(locale)}
          </span>
          <span className="text-xs uppercase text-olive-800 dark:text-olive-800-dark sm:text-sm">
            {t("prizePool")}
          </span>
        </div>
      )}
    </div>
  );
};

function getTimestampFromDateString(date: string | undefined): number {
  return date ? new Date(date).getTime() : 0;
}

export default WithServerComponentErrorBoundary(TournamentTimeline);

import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import LeaderboardApi from "@/services/leaderboard";
import PostsApi from "@/services/posts";
import { Post, PostStatus } from "@/types/post";
import { Tournament } from "@/types/projects";
import { LeaderboardDetails } from "@/types/scoring";
import { logError } from "@/utils/errors";

import ActiveTournamentTimeline from "./active_tournament_timeline";
import ClosedTournamentTimeline from "./closed_tournament_timeline";

type Props = {
  tournament: Tournament;
};

const TournamentTimeline: FC<Props> = async ({ tournament }) => {
  const t = await getTranslations();
  const locale = await getLocale();

  const { results: questions } = await PostsApi.getPosts({
    tournaments: [tournament.id.toString()],
    statuses: [
      PostStatus.OPEN,
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.UPCOMING,
    ],
    limit: 1000,
  });
  let leaderboardDetails: LeaderboardDetails | null = null;
  try {
    leaderboardDetails = await LeaderboardApi.getProjectLeaderboard(
      tournament.id
    );
  } catch (error) {
    logError(error);
  }
  const showLastParticipationDay =
    leaderboardDetails &&
    leaderboardDetails.score_type === "spot_peer_tournament";

  const {
    lastParticipationDayTimestamp,
    latestScheduledResolutionTimestamp,
    latestActualResolutionTimestamp,
    latestScheduledCloseTimestamp,
    latestActualCloseTimestamp,
    isAllQuestionsResolved,
    isAllQuestionsClosed,
  } = extractTournamentTimelineData(questions);

  return (
    <div className="mt-4 flex flex-col gap-x-5 gap-y-4 sm:mt-5 sm:flex-row">
      {!isAllQuestionsClosed ? (
        <ActiveTournamentTimeline
          tournament={tournament}
          lastParticipationDayTimestamp={
            showLastParticipationDay ? lastParticipationDayTimestamp : null
          }
          latestScheduledCloseTimestamp={latestScheduledCloseTimestamp}
        />
      ) : (
        <ClosedTournamentTimeline
          tournament={tournament}
          latestScheduledResolutionTimestamp={
            latestScheduledResolutionTimestamp
          }
          latestActualCloseTimestamp={latestActualCloseTimestamp}
          isAllQuestionsResolved={isAllQuestionsResolved}
          latestActualResolutionTimestamp={latestActualResolutionTimestamp}
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

function extractTournamentTimelineData(posts: Post[]): {
  lastParticipationDayTimestamp: number;
  latestScheduledResolutionTimestamp: number;
  latestActualResolutionTimestamp: number;
  latestScheduledCloseTimestamp: number;
  latestActualCloseTimestamp: number;
  isAllQuestionsResolved: boolean;
  isAllQuestionsClosed: boolean;
} {
  let isAllQuestionsResolved = true;
  let isAllQuestionsClosed = true;
  const {
    lastParticipationDayTimestamp,
    latestActualResolutionTimestamp,
    latestScheduledResolutionTimestamp,
    latestScheduledCloseTimestamp,
    latestActualCloseTimestamp,
  } = posts.reduce(
    (
      {
        lastParticipationDayTimestamp,
        latestActualResolutionTimestamp,
        latestScheduledResolutionTimestamp,
        latestScheduledCloseTimestamp,
        latestActualCloseTimestamp,
      },
      post
    ) => {
      if (!post.notebook && post.resolved === false) {
        isAllQuestionsResolved = false;
      }
      if (!post.notebook && post.actual_close_time === null) {
        isAllQuestionsClosed = false;
      }

      // find latest hidden period and actual resolution timestamps
      let hiddenPeriod = 0;
      let localActualResolutionTimestamp = 0;
      if (post.question) {
        hiddenPeriod = post.question.cp_reveal_time
          ? new Date(post.question.cp_reveal_time).getTime()
          : 0;
        localActualResolutionTimestamp = post.question.actual_resolve_time
          ? new Date(post.question.actual_resolve_time).getTime()
          : 0;
      } else if (post.conditional) {
        const yesRevealDate = post.conditional.question_yes.cp_reveal_time;
        const noRevealDate = post.conditional.question_no.cp_reveal_time;
        hiddenPeriod = Math.max(
          yesRevealDate ? new Date(yesRevealDate).getTime() : 0,
          noRevealDate ? new Date(noRevealDate).getTime() : 0
        );

        const yesActualResolutionTimestamp =
          post.conditional.question_yes.actual_resolve_time;
        const noActualResolutionTimestamp =
          post.conditional.question_no.actual_resolve_time;
        localActualResolutionTimestamp = Math.max(
          yesActualResolutionTimestamp
            ? new Date(yesActualResolutionTimestamp).getTime()
            : 0,
          noActualResolutionTimestamp
            ? new Date(noActualResolutionTimestamp).getTime()
            : 0
        );
      } else if (post.group_of_questions) {
        hiddenPeriod = post.group_of_questions.questions.reduce(
          (acc, question) => {
            return Math.max(
              acc,
              question.cp_reveal_time
                ? new Date(question.cp_reveal_time).getTime()
                : 0
            );
          },
          0
        );
        localActualResolutionTimestamp =
          post.group_of_questions.questions.reduce((acc, question) => {
            return Math.max(
              acc,
              question.actual_resolve_time
                ? new Date(question.actual_resolve_time).getTime()
                : 0
            );
          }, 0);
      }
      return {
        lastParticipationDayTimestamp: Math.max(
          lastParticipationDayTimestamp,
          hiddenPeriod
        ),
        latestActualResolutionTimestamp: Math.max(
          latestActualResolutionTimestamp,
          localActualResolutionTimestamp
        ),
        latestScheduledResolutionTimestamp: Math.max(
          latestScheduledResolutionTimestamp,
          new Date(post.scheduled_resolve_time).getTime()
        ),
        latestActualCloseTimestamp: Math.max(
          latestActualCloseTimestamp,
          new Date(post.actual_close_time).getTime()
        ),
        latestScheduledCloseTimestamp: Math.max(
          latestScheduledCloseTimestamp,
          new Date(post.scheduled_close_time).getTime()
        ),
      };
    },
    {
      lastParticipationDayTimestamp: 0,
      latestScheduledResolutionTimestamp: 0,
      latestActualResolutionTimestamp: 0,
      latestScheduledCloseTimestamp: 0,
      latestActualCloseTimestamp: 0,
    }
  );
  return {
    lastParticipationDayTimestamp,
    latestActualResolutionTimestamp,
    latestScheduledResolutionTimestamp,
    latestScheduledCloseTimestamp,
    latestActualCloseTimestamp,
    isAllQuestionsResolved,
    isAllQuestionsClosed,
  };
}
export default WithServerComponentErrorBoundary(TournamentTimeline);

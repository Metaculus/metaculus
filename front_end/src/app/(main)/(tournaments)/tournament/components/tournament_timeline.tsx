import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import LeaderboardApi from "@/services/leaderboard";
import PostsApi from "@/services/posts";
import { Post } from "@/types/post";
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
    limit: tournament.questions_count,
  });
  let leaderboardDetails: LeaderboardDetails | null = null;
  try {
    // this throw 404 error for some tournaments
    // the same error occurs inside the ProjectLeaderboard component but it leads to component not being rendered without an error
    leaderboardDetails = await LeaderboardApi.getProjectLeaderboard(
      tournament.id
    );
  } catch (error) {
    logError(error);
  }
  const showLastParticipationDay =
    leaderboardDetails && leaderboardDetails.score_type === "peer_tournament";

  const {
    lastParticipationDayTimestamp,
    latestScheduledResolutionTimestamp,
    isAllQuestionsResolved,
  } = extractTournamentTimelineData(questions);

  return (
    <>
      <div>
        <p>{leaderboardDetails?.score_type}</p>
        {/* {showLastParticipationDay && ( */}
        <p>
          Last participation date:{" "}
          {format(new Date(lastParticipationDayTimestamp), "yyyy-MM-dd")}
        </p>
        {/* )} */}
        <p>
          Latest scheduled resolution date:{" "}
          {format(new Date(latestScheduledResolutionTimestamp), "yyyy-MM-dd")}
        </p>
        <p>All questions resolved: {isAllQuestionsResolved.toString()}</p>
      </div>
      {/* Actual timeline component */}
      {/* Upcoming/ In Progress */}
      <div className="flex flex-col gap-x-5 gap-y-4 sm:flex-row">
        {tournament.is_ongoing ? (
          <ActiveTournamentTimeline
            tournament={tournament}
            lastParticipationDayTimestamp={
              showLastParticipationDay ? lastParticipationDayTimestamp : null
            }
            latestScheduledResolutionTimestamp={
              latestScheduledResolutionTimestamp
            }
          />
        ) : (
          <ClosedTournamentTimeline
            tournament={tournament}
            latestScheduledResolutionTimestamp={
              latestScheduledResolutionTimestamp
            }
            isAllQuestionsResolved={isAllQuestionsResolved}
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
    </>
  );
};

function extractTournamentTimelineData(posts: Post[]): {
  lastParticipationDayTimestamp: number;
  latestScheduledResolutionTimestamp: number;
  isAllQuestionsResolved: boolean;
} {
  let isAllQuestionsResolved = true;
  const { lastParticipationDayTimestamp, latestScheduledResolutionTimestamp } =
    posts.reduce(
      (
        { lastParticipationDayTimestamp, latestScheduledResolutionTimestamp },
        post
      ) => {
        // check if all questions are resolved
        if (!post.notebook && post.resolved === false) {
          isAllQuestionsResolved = false;
        }
        // find latest hidden period timestamp
        let hiddenPeriod = 0;
        if (post.question) {
          hiddenPeriod = post.question.cp_reveal_time
            ? new Date(post.question.cp_reveal_time).getTime()
            : 0;
        } else if (post.conditional) {
          const yesRevealDate = post.conditional.question_yes.cp_reveal_time;
          const noRevealDate = post.conditional.question_no.cp_reveal_time;
          hiddenPeriod = Math.max(
            yesRevealDate ? new Date(yesRevealDate).getTime() : 0,
            noRevealDate ? new Date(noRevealDate).getTime() : 0
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
        }

        return {
          lastParticipationDayTimestamp: Math.max(
            lastParticipationDayTimestamp,
            hiddenPeriod
          ),
          // find latest scheduled resolution timestamp
          latestScheduledResolutionTimestamp: Math.max(
            latestScheduledResolutionTimestamp,
            new Date(post.scheduled_resolve_time).getTime()
          ),
        };
      },
      {
        lastParticipationDayTimestamp: 0,
        latestScheduledResolutionTimestamp: 0,
      }
    );
  return {
    lastParticipationDayTimestamp,
    latestScheduledResolutionTimestamp,
    isAllQuestionsResolved,
  };
}
export default WithServerComponentErrorBoundary(TournamentTimeline);

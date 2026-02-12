import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import RichText from "@/components/rich_text";
import { PostStatus } from "@/types/post";
import { FeedProjectTile, FeedTileRule } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { safeTs } from "@/utils/formatters/date";
import { formatMoneyUSD } from "@/utils/formatters/number";
import { getProjectLink } from "@/utils/navigation";
import { formatTournamentRelativeDelta } from "@/utils/projects/helpers";

type Props = {
  tile: FeedProjectTile;
  feedPage: number;
};

const FeedTournamentTile: FC<Props> = ({ tile, feedPage }) => {
  const t = useTranslations();
  const { project } = tile;
  const href = useMemo(() => {
    const base = getProjectLink(project);
    return tile.rule === FeedTileRule.ALL_QUESTIONS_RESOLVED
      ? `${base}#leaderboard`
      : base;
  }, [project, tile.rule]);
  const prize = useMemo(
    () => formatMoneyUSD(project.prize_pool),
    [project.prize_pool]
  );

  const ruleLabel = getRuleLabel(t, tile);
  const statusLabel = getStatusLabel(t, project);

  return (
    <Link
      href={href}
      onClick={() =>
        sendAnalyticsEvent("feedProjectTileClick", {
          project_id: project.id,
          project_name: project.name,
          rule: tile.rule,
          feed_page: feedPage,
        })
      }
      className="relative flex flex-col gap-3 overflow-hidden rounded px-6 py-5 text-gray-0 no-underline"
      style={
        project.header_image
          ? {
              backgroundImage: `url(${project.header_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {project.header_image && <div className="absolute inset-0 bg-black/50" />}
      {!project.header_image && (
        <div className="absolute inset-0 bg-blue-100" />
      )}

      <h4 className="relative my-0 text-base font-medium text-gray-0">
        {project.name}
      </h4>

      <div className="relative flex flex-wrap items-center gap-3 text-xs">
        {(!tile.rule || tile.rule === FeedTileRule.NEW_TOURNAMENT) && prize && (
          <div className="rounded-xl border border-olive-400 bg-olive-400 px-2.5 py-1.5 text-olive-900">
            <RichText>
              {(tags) =>
                t.rich("feedTilePrizePool", { ...tags, amount: prize })
              }
            </RichText>
          </div>
        )}
        <div className="rounded-xl border border-gray-300 px-2.5 py-1.5 text-gray-0">
          {ruleLabel}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-5 px-1.5 py-1 text-xs">
        {statusLabel && (
          <span className="flex items-center gap-2">
            <span className="inline-flex h-4 w-4 items-center justify-center">
              <PostStatusIcon
                status={getTournamentPostStatus(project)}
                published_at={project.start_date}
                open_time={project.start_date}
                scheduled_close_time={project.close_date ?? project.start_date}
                resolution={null}
                strokeClassName="stroke-gray-0"
              />
            </span>
            <span>{statusLabel}</span>
          </span>
        )}
        <span className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-[12px] text-gray-400"
          />
          {t("feedTileForecasters", {
            count: project.forecasters_count ?? 0,
          })}
        </span>
      </div>
    </Link>
  );
};

function getRuleLabel(
  t: ReturnType<typeof useTranslations>,
  tile: FeedProjectTile
): string {
  switch (tile.rule) {
    case FeedTileRule.NEW_TOURNAMENT:
      return t("feedTileNewTournament");
    case FeedTileRule.NEW_QUESTIONS:
      return t("feedTileForecastNewQuestions", {
        count: tile.recently_opened_questions,
      });
    case FeedTileRule.RESOLVED_QUESTIONS:
      return t("feedTileQuestionsResolved", {
        count: tile.recently_resolved_questions,
      });
    case FeedTileRule.ALL_QUESTIONS_RESOLVED:
      return t("feedTileCheckLeaderboards");
    default:
      return t("feedTilePopularTournament");
  }
}

function getStatusLabel(
  t: ReturnType<typeof useTranslations>,
  project: FeedProjectTile["project"]
): ReactNode | null {
  const now = Date.now();
  const startTs = safeTs(project.start_date);
  const closeTs = safeTs(project.close_date);
  const resolveTs = safeTs(
    project.timeline?.latest_actual_resolve_time ?? null
  );

  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  if (project.timeline?.all_questions_resolved && resolveTs) {
    return t.rich("feedTileResolvedAgo", {
      strong,
      when: formatTournamentRelativeDelta(t, now - resolveTs),
    });
  }

  if (closeTs && now > closeTs) {
    return t.rich("feedTileClosedAgo", {
      strong,
      when: formatTournamentRelativeDelta(t, now - closeTs),
    });
  }

  if (closeTs && now < closeTs) {
    return t.rich("feedTileClosesIn", {
      strong,
      when: formatTournamentRelativeDelta(t, closeTs - now),
    });
  }

  if (startTs && now - startTs < 14 * 86_400_000) {
    return t.rich("feedTileStartedAgo", {
      strong,
      when: formatTournamentRelativeDelta(t, now - startTs),
    });
  }

  return null;
}

function getTournamentPostStatus(
  project: FeedProjectTile["project"]
): PostStatus {
  if (project.timeline?.all_questions_resolved) return PostStatus.RESOLVED;
  const closeTs = safeTs(project.close_date);
  if (closeTs && Date.now() > closeTs) return PostStatus.CLOSED;
  return PostStatus.OPEN;
}

export default FeedTournamentTile;

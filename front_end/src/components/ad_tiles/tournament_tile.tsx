"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { PostStatus } from "@/types/post";
import { CombinedFeedTile, FeedTileRule } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { safeTs } from "@/utils/formatters/date";
import { getProjectLink } from "@/utils/navigation";
import { formatTournamentRelativeDelta } from "@/utils/projects/helpers";

import TileShell from "./tile_shell";

type Props = {
  tile: CombinedFeedTile & { type: "project" };
  size?: "narrow" | "wide";
  onDismiss?: () => void;
};

const TournamentTile: FC<Props> = ({ tile, size = "wide", onDismiss }) => {
  const t = useTranslations();
  const { project, rule, project_resolution_date } = tile;

  const href = useMemo(() => {
    const base = getProjectLink(project);
    return rule === FeedTileRule.ALL_QUESTIONS_RESOLVED
      ? `${base}#leaderboard`
      : base;
  }, [project, rule]);

  const rawCloseTime =
    rule === FeedTileRule.ALL_QUESTIONS_RESOLVED && project_resolution_date
      ? project_resolution_date
      : project.close_date ??
        project.forecasting_end_date ??
        project.start_date;
  const rawCloseTs = safeTs(rawCloseTime) ?? Date.now() + 1000;
  const scheduledCloseTime = new Date(
    Math.max(rawCloseTs, Date.now() + 1000)
  ).toISOString();

  const ruleLabel = getRuleLabel(t, tile);
  const statusLabel = getStatusLabel(t, tile);

  const ctaChip = ruleLabel ? (
    <span className="inline-flex items-center justify-center rounded-full border border-blue-400 bg-gray-0 px-3 py-2 text-sm font-medium leading-4 text-blue-700">
      {ruleLabel}
    </span>
  ) : null;

  const statusItems = (
    <>
      {statusLabel && (
        <span className="flex items-center gap-2 text-xs">
          <span className="inline-flex h-4 w-4 items-center justify-center">
            <PostStatusIcon
              status={PostStatus.OPEN}
              published_at={project.start_date}
              open_time={project.start_date}
              scheduled_close_time={scheduledCloseTime}
              resolution={null}
              strokeClassName="stroke-gray-0"
              dotFillClassName="fill-gray-0"
              clockFillClass="fill-mint-400/50"
            />
          </span>
          <span>{statusLabel}</span>
        </span>
      )}
      {project.forecasters_count > 0 && (
        <span className="flex items-center gap-2 text-xs">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-[12px] text-gray-400"
          />
          {t("feedTileForecasters", { count: project.forecasters_count ?? 0 })}
        </span>
      )}
    </>
  );

  return (
    <TileShell
      href={href}
      image={project.header_image}
      onDismiss={onDismiss}
      onClick={() =>
        sendAnalyticsEvent("feedProjectTileClick", {
          project_id: project.id,
          project_name: project.name,
          rule: tile.rule,
        })
      }
    >
      <div className="relative flex flex-col">
        <h4 className="my-0 text-lg font-bold leading-7 text-gray-0">
          {project.name}
        </h4>
        {project.description_preview && (
          <p className="my-0 mt-2 text-sm font-normal leading-5 text-gray-0">
            {project.description_preview}
          </p>
        )}

        {size === "narrow" ? (
          <>
            {ctaChip && <div className="mt-8">{ctaChip}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-4 px-1">
              {statusItems}
            </div>
          </>
        ) : (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {ctaChip}
            {statusItems}
          </div>
        )}
      </div>
    </TileShell>
  );
};

function getRuleLabel(
  t: ReturnType<typeof useTranslations>,
  tile: CombinedFeedTile & { type: "project" }
): string | undefined {
  switch (tile.rule) {
    case FeedTileRule.NEW_TOURNAMENT:
      return t("feedTileNewTournament");
    case FeedTileRule.NEW_QUESTIONS:
      return t("feedTileForecastNewQuestions", {
        count: tile.recently_opened_questions,
      });
    case FeedTileRule.RESOLVED_QUESTIONS:
      return t("feedTileQuestionsRecentlyResolved", {
        count: tile.recently_resolved_questions,
      });
    case FeedTileRule.ALL_QUESTIONS_RESOLVED:
      return t("feedTileCheckLeaderboards");
  }
}

function getStatusLabel(
  t: ReturnType<typeof useTranslations>,
  {
    project,
    all_questions_resolved,
    project_resolution_date,
  }: CombinedFeedTile & { type: "project" }
): ReactNode | null {
  const now = Date.now();
  const startTs = safeTs(project.start_date);
  const closeTs = safeTs(project.close_date);
  const resolveTs = safeTs(project_resolution_date);

  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  if (all_questions_resolved && resolveTs) {
    const key = now > resolveTs ? "feedTileResolvedAgo" : "feedTileResolvesIn";
    return t.rich(key, {
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

  if (startTs && Math.abs(now - startTs) < 14 * 86_400_000) {
    const key = now > startTs ? "feedTileStartedAgo" : "feedTileStartsIn";
    return t.rich(key, {
      strong,
      when: formatTournamentRelativeDelta(t, Math.abs(now - startTs)),
    });
  }

  return null;
}

export default TournamentTile;

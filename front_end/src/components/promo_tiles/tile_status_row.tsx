"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import { PostStatus } from "@/types/post";
import { FeedTileRule, TournamentPreview } from "@/types/projects";
import { safeTs } from "@/utils/formatters/date";
import { formatTournamentRelativeDelta } from "@/utils/projects/helpers";

type Props = {
  project: TournamentPreview;
  rule?: FeedTileRule | null;
  projectResolutionDate?: string | null;
  allQuestionsResolved?: boolean;
  className?: string;
};

export const TileStatusRow: FC<Props> = ({
  project,
  rule,
  projectResolutionDate,
  allQuestionsResolved,
  className,
}) => {
  const t = useTranslations();
  const statusLabel = getStatusLabel(t, project, {
    allQuestionsResolved,
    projectResolutionDate,
  });
  const scheduledCloseTime = getScheduledCloseTime(project, {
    rule,
    projectResolutionDate,
  });

  if (!statusLabel && project.forecasters_count <= 0) return null;

  return (
    <div
      className={`relative flex items-center gap-2 text-xs ${className ?? "flex-wrap px-1.5 py-1"}`}
    >
      {statusLabel && (
        <span className="flex items-center gap-2">
          <span className="inline-flex h-4 w-4 items-center justify-center">
            <PostStatusIcon
              // We always show active clock here
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
        <span className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={faUsers}
            className="text-[12px] text-gray-400"
          />
          {t("feedTileForecasters", { count: project.forecasters_count })}
        </span>
      )}
    </div>
  );
};

function getScheduledCloseTime(
  project: TournamentPreview,
  {
    rule,
    projectResolutionDate,
  }: { rule?: FeedTileRule | null; projectResolutionDate?: string | null } = {}
): string {
  const rawCloseTime =
    rule === FeedTileRule.ALL_QUESTIONS_RESOLVED && projectResolutionDate
      ? projectResolutionDate
      : project.forecasting_end_date ??
        project.close_date ??
        project.start_date;
  const rawCloseTs = safeTs(rawCloseTime) ?? Date.now() + 1000;
  return new Date(Math.max(rawCloseTs, Date.now() + 1000)).toISOString();
}

function getStatusLabel(
  t: ReturnType<typeof useTranslations>,
  project: TournamentPreview,
  {
    allQuestionsResolved,
    projectResolutionDate,
  }: {
    allQuestionsResolved?: boolean;
    projectResolutionDate?: string | null;
  } = {}
): ReactNode | null {
  const now = Date.now();
  const closeTs = safeTs(project.forecasting_end_date ?? project.close_date);
  const startTs = safeTs(project.start_date);
  const resolveTs = safeTs(projectResolutionDate);

  const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

  if (allQuestionsResolved && resolveTs) {
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

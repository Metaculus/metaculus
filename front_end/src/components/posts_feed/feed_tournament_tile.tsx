"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo } from "react";

import PostStatusIcon from "@/components/post_status/status_icon";
import RichText from "@/components/rich_text";
import { PostStatus } from "@/types/post";
import { FeedProjectTile, FeedTileRule } from "@/types/projects";
import { bucketRelativeMs } from "@/utils/formatters/date";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  tile: FeedProjectTile;
};

const FeedTournamentTile: FC<Props> = ({ tile }) => {
  const t = useTranslations();
  const { project } = tile;
  const href = useMemo(() => getProjectLink(project), [project]);
  const prize = useMemo(
    () => formatMoneyUSD(project.prize_pool),
    [project.prize_pool]
  );

  const ruleLabel = getRuleLabel(t, tile);
  const statusLabel = getStatusLabel(t, project);

  return (
    <Link
      href={href}
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
      {project.header_image && <div className="absolute inset-0 bg-black/65" />}
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
              />
            </span>
            {statusLabel}
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
      when: formatRelativeDelta(t, now - resolveTs),
    });
  }

  if (closeTs && now > closeTs) {
    return t.rich("feedTileClosedAgo", {
      strong,
      when: formatRelativeDelta(t, now - closeTs),
    });
  }

  if (closeTs && now < closeTs) {
    return t.rich("feedTileClosesIn", {
      strong,
      when: formatRelativeDelta(t, closeTs - now),
    });
  }

  if (startTs && now - startTs < 14 * 86_400_000) {
    return t.rich("feedTileStartedAgo", {
      strong,
      when: formatRelativeDelta(t, now - startTs),
    });
  }

  return null;
}

function formatRelativeDelta(
  t: ReturnType<typeof useTranslations>,
  deltaMs: number
): string {
  const r = bucketRelativeMs(Math.abs(deltaMs));
  if (r.kind === "soon") return t("tournamentRelativeSoon");
  if (r.kind === "farFuture") return t("tournamentRelativeFarFuture");
  if (r.kind === "underMinute") return t("tournamentRelativeUnderMinute");
  const { n, unit } = r.value;
  const unitLabel =
    n === 1
      ? t("tournamentUnit", { unit })
      : t("tournamentUnitPlural", { unit });
  return `${n} ${unitLabel}`;
}

function formatMoneyUSD(amount: string | null | undefined) {
  if (!amount) return null;
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
}

function getTournamentPostStatus(
  project: FeedProjectTile["project"]
): PostStatus {
  if (project.timeline?.all_questions_resolved) return PostStatus.RESOLVED;
  const closeTs = safeTs(project.close_date);
  if (closeTs && Date.now() > closeTs) return PostStatus.CLOSED;
  return PostStatus.OPEN;
}

function safeTs(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export default FeedTournamentTile;

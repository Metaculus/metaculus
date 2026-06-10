"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import RichText from "@/components/rich_text";
import { FeedTileRule, ProjectCombinedFeedTile } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { formatMoneyUSD } from "@/utils/formatters/number";
import { getProjectLink } from "@/utils/navigation";

import { TileStatusRow } from "./tile_status_row";

type Props = {
  tile: ProjectCombinedFeedTile;
  feedPage: number;
  onDismiss?: () => void;
};

const TournamentTile: FC<Props> = ({ tile, feedPage, onDismiss }) => {
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
      className="group relative flex flex-col gap-2 overflow-hidden rounded border border-transparent px-6 py-5 text-gray-0 no-underline transition-colors hover:border-gray-0/70"
    >
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded text-gray-0/60 transition-colors hover:text-gray-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}

      <div className="absolute inset-0 bg-blue-900" />
      {project.header_image && (
        <Image
          src={project.header_image}
          alt=""
          fill
          className="size-full object-cover object-center"
          unoptimized
        />
      )}

      <div className="relative flex flex-col items-center gap-2 text-center">
        <h4 className="my-0 text-base font-medium text-gray-0">
          {project.name}
        </h4>

        {ruleLabel && (
          <p className="my-0 text-sm font-normal leading-5 text-gray-0">
            {ruleLabel}
          </p>
        )}

        {(!tile.rule || tile.rule === FeedTileRule.NEW_TOURNAMENT) && prize && (
          <div>
            <div className="rounded-xl border border-olive-400 bg-olive-400 px-2.5 py-1.5 text-xs text-olive-900">
              <RichText>
                {(tags) =>
                  t.rich("feedTilePrizePool", { ...tags, amount: prize })
                }
              </RichText>
            </div>
          </div>
        )}
      </div>

      <TileStatusRow
        project={project}
        rule={tile.rule}
        projectResolutionDate={tile.project_resolution_date}
        allQuestionsResolved={tile.all_questions_resolved}
        className="flex-wrap justify-center px-1.5 py-1"
      />
    </Link>
  );
};

function getRuleLabel(
  t: ReturnType<typeof useTranslations>,
  tile: ProjectCombinedFeedTile
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

export default TournamentTile;

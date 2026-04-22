"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import TrophyIcon from "@/components/icons/trophy";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import Chip from "@/components/ui/chip";
import useContainerSize from "@/hooks/use_container_size";
import { PostWithForecasts } from "@/types/post";
import { Project, TaxonomyProjectType, TournamentType } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { getPostLink, getProjectLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const MetaRow: FC<Props> = ({ post, className }) => {
  const t = useTranslations();
  const resolutionData = extractPostResolution(post);
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const projectsData = post.projects;
  const allProjects: Project[] = projectsData
    ? [
        ...(projectsData.index ?? []),
        ...(projectsData.tournament ?? []),
        ...(projectsData.question_series ?? []),
        ...(projectsData.community ?? []),
        ...(projectsData.category ?? []),
        ...(projectsData.leaderboard_tag ?? []),
      ]
    : [];

  // Drop "forecasters" label first, then reduce visible chips
  const compactCounters = width > 0 && width < 600;
  const maxVisibleChips = width > 0 && width < 500 ? 1 : 2;

  const visibleChips = allProjects.slice(0, maxVisibleChips);
  const hiddenChips = allProjects.slice(maxVisibleChips);

  const getChipContent = (element: Project) => {
    if (element.type === TournamentType.Tournament) {
      return (
        <span className="flex min-w-0 items-center gap-1">
          <TrophyIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate">{element.name}</span>
        </span>
      );
    }
    if (element.type === TaxonomyProjectType.LeaderboardTag) {
      return (
        <span className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-sm leading-none">🏆</span>
          <span className="min-w-0 truncate">{element.name}</span>
        </span>
      );
    }
    return <span className="min-w-0 truncate">{element.name}</span>;
  };

  const chipColor = (element: Project) =>
    Object.values(TaxonomyProjectType).includes(
      element.type as TaxonomyProjectType
    )
      ? "olive"
      : "orange";

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-6 px-4 lg:px-8",
        className
      )}
    >
      <div className="flex shrink-0 items-center gap-1.5">
        <PostVoter post={post} />
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="bg-gray-200 dark:bg-gray-200-dark"
          compact={false}
        />
        <PostStatus post={post} resolution={resolutionData} compact={false} />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={compactCounters}
        />
      </div>

      <div className="flex min-w-0 items-center gap-2">
        {visibleChips.map((element) => (
          <Chip
            color={chipColor(element)}
            key={element.id}
            href={getProjectLink(element)}
            className="min-w-0 overflow-hidden text-sm font-medium leading-4 [&>*]:min-w-0"
            onClick={() =>
              sendAnalyticsEvent("questionTagClicked", {
                event_category: element.name,
              })
            }
          >
            {getChipContent(element)}
          </Chip>
        ))}

        {hiddenChips.length > 0 && (
          <div ref={moreRef} className="relative shrink-0">
            <Chip
              color="gray"
              className="cursor-pointer text-sm font-medium leading-4"
              onClick={() => setIsMoreOpen((prev) => !prev)}
            >
              {t("nMore", { count: hiddenChips.length })}
            </Chip>
            {isMoreOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 flex max-w-[250px] flex-wrap gap-2 rounded border border-gray-300 bg-gray-0 p-3 shadow-lg dark:border-gray-300-dark dark:bg-gray-0-dark">
                {hiddenChips.map((element) => (
                  <Chip
                    color={chipColor(element)}
                    key={element.id}
                    href={getProjectLink(element)}
                    className="overflow-hidden text-sm font-medium leading-4"
                    onClick={() => {
                      setIsMoreOpen(false);
                      sendAnalyticsEvent("questionTagClicked", {
                        event_category: element.name,
                      });
                    }}
                  >
                    {getChipContent(element)}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaRow;

"use client";
import { FC } from "react";

import SidebarContainer from "@/app/(main)/questions/[id]/components/sidebar/sidebar_container";
import Chip from "@/components/ui/chip";
import { POST_CATEGORIES_FILTER } from "@/constants/posts_feed";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getLeaderboardTagUrl, getProjectLink } from "@/utils/navigation";

type Props = {
  projects: PostWithForecasts["projects"];
};

const SidebarQuestionProjects: FC<Props> = ({ projects: projectsData }) => {
  const {
    category: _category,
    tournament: _tournament,
    question_series: _question_series,
    community: _community,
    index: _index,
    leaderboard_tag: _leaderboard_tag,
  } = projectsData;
  const category = _category ?? [];
  const tournament = _tournament ?? [];
  const question_series = _question_series ?? [];
  const community = _community ?? [];
  const index = _index ?? [];
  const leaderboard_tag = _leaderboard_tag ?? [];

  const tournamentProjects = [
    ...index,
    ...tournament,
    ...question_series,
    ...community,
  ];
  const allProjects = [...tournamentProjects, ...category, ...leaderboard_tag];

  if (allProjects.length > 0) {
    return (
      <SidebarContainer>
        <div className="flex flex-col items-center justify-center gap-4 self-stretch">
          <div className="flex flex-wrap content-start items-start gap-2.5 self-stretch @lg:m-0">
            {tournamentProjects.map((element) => (
              <Chip
                color="orange"
                key={element.id}
                href={getProjectLink(element)}
                onClick={() =>
                  sendAnalyticsEvent("questionTagClicked", {
                    event_category: element.name,
                  })
                }
              >
                {element.name}
              </Chip>
            ))}

            {category.map((element) => (
              <Chip
                color="olive"
                key={element.id}
                href={`/questions/?${POST_CATEGORIES_FILTER}=${element.slug}&for_main_feed=false`}
                onClick={() =>
                  sendAnalyticsEvent("questionTagClicked", {
                    event_category: element.name,
                  })
                }
              >
                {element.name}
              </Chip>
            ))}

            {leaderboard_tag.map((element) => (
              <Chip
                color="olive"
                key={element.id}
                href={getLeaderboardTagUrl(element)}
                onClick={() =>
                  sendAnalyticsEvent("questionTagClicked", {
                    event_category: element.name,
                  })
                }
              >
                {element.name}
              </Chip>
            ))}
          </div>
        </div>
      </SidebarContainer>
    );
  }
};

export default SidebarQuestionProjects;

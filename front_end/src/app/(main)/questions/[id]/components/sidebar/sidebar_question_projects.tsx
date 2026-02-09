"use client";
import { FC } from "react";

import SidebarContainer from "@/app/(main)/questions/[id]/components/sidebar/sidebar_container";
import Chip from "@/components/ui/chip";
import { PostWithForecasts } from "@/types/post";
import { TaxonomyProjectType } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  projects: PostWithForecasts["projects"];
};

const SidebarQuestionProjects: FC<Props> = ({ projects: projectsData }) => {
  if (!projectsData) {
    return null;
  }

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

  const allProjects = [
    ...index,
    ...tournament,
    ...question_series,
    ...community,
    ...category,
    ...leaderboard_tag,
  ];

  const getChipText = (name: string, type?: string) =>
    type === "leaderboard_tag" ? `🏆 ${name}` : name;

  if (allProjects.length > 0) {
    return (
      <SidebarContainer>
        <div className="flex flex-col items-center justify-center gap-4 self-stretch">
          <div className="flex flex-wrap content-start items-start gap-2.5 self-stretch @lg:m-0">
            {allProjects.map((element) => (
              <Chip
                color={
                  Object.values(TaxonomyProjectType).includes(
                    element.type as TaxonomyProjectType
                  )
                    ? "olive"
                    : "orange"
                }
                key={element.id}
                href={getProjectLink(element)}
                onClick={() =>
                  sendAnalyticsEvent("questionTagClicked", {
                    event_category: element.name,
                  })
                }
              >
                {getChipText(element.name, element.type)}
              </Chip>
            ))}
          </div>
        </div>
      </SidebarContainer>
    );
  }
};

export default SidebarQuestionProjects;

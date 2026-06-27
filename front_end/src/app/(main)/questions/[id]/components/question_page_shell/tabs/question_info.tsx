"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Chip from "@/components/ui/chip";
import { usePostTextSections } from "@/hooks/use_post_text_sections";
import { PostWithForecasts } from "@/types/post";
import { ProjectVisibility } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getProjectLink } from "@/utils/navigation";

import SidebarQuestionInfo from "../../sidebar/sidebar_question_info";
import { getChipColor, getChipContent } from "../project_chip_helpers";

type Props = {
  post: PostWithForecasts;
};

const QuestionInfoTab: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const sections = usePostTextSections(post);

  const projectsData = post.projects;
  const defaultProjectId = projectsData?.default_project?.id;
  const allProjects = projectsData
    ? [
        ...(projectsData.index ?? []),
        ...(projectsData.tournament ?? []),
        ...(projectsData.question_series ?? []),
        ...(projectsData.community ?? []),
        ...(projectsData.category ?? []),
        ...(projectsData.leaderboard_tag ?? []),
      ].filter(
        (project) =>
          !("visibility" in project) ||
          project.visibility !== ProjectVisibility.Unlisted ||
          project.id === defaultProjectId
      )
    : [];

  return (
    <div className="flex flex-col items-start gap-10 lg:flex-row">
      <aside className="flex w-full flex-col gap-8 lg:w-[284px] lg:shrink-0">
        <SidebarQuestionInfo postData={post} />
        {allProjects.length > 0 && (
          <section className="flex w-full flex-col gap-3">
            <h3 className="m-0 text-base font-medium leading-6 text-blue-900 dark:text-blue-900-dark">
              {t("projectsTags")}
            </h3>
            <div className="flex flex-wrap gap-3">
              {allProjects.map((element) => (
                <Chip
                  color={getChipColor(element)}
                  key={element.id}
                  href={getProjectLink(element)}
                  className="min-w-0 overflow-hidden [&>*]:min-w-0"
                  onClick={() =>
                    sendAnalyticsEvent("questionTagClicked", {
                      event_category: element.name,
                    })
                  }
                >
                  {getChipContent(element)}
                </Chip>
              ))}
            </div>
          </section>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-8 text-blue-900 dark:text-blue-900-dark">
        {sections.map((section, idx) => (
          <section
            key={`${section.title}-${idx}`}
            className="flex w-full flex-col gap-2"
          >
            <h3 className="m-0 text-base font-medium leading-6">
              {section.title}
            </h3>
            <div className="text-base font-normal leading-6 text-blue-900 dark:text-blue-900-dark">
              <MarkdownEditor withCodeBlocks markdown={section.markdown} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default QuestionInfoTab;

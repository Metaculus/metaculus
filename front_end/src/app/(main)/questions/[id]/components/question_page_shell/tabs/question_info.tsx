"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Chip from "@/components/ui/chip";
import { PostWithForecasts } from "@/types/post";
import { TaxonomyProjectType } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getProjectLink } from "@/utils/navigation";

import SidebarQuestionInfo from "../../sidebar/sidebar_question_info";

type Props = {
  post: PostWithForecasts;
};

type MarkdownSection = { title: string; markdown: string };

const getChipText = (name: string, type?: string) =>
  type === "leaderboard_tag" ? `🏆 ${name}` : name;

const useTextSections = (post: PostWithForecasts): MarkdownSection[] => {
  const t = useTranslations();

  if (post.conditional) {
    const { condition, condition_child } = post.conditional;
    const sections: MarkdownSection[] = [];
    if (condition.resolution_criteria) {
      sections.push({
        title: t("parentResolutionCriteria"),
        markdown: condition.resolution_criteria,
      });
    }
    if (condition.fine_print) {
      sections.push({ title: t("finePrint"), markdown: condition.fine_print });
    }
    if (condition.description) {
      sections.push({
        title: t("parentBackgroundInfo"),
        markdown: condition.description,
      });
    }
    if (condition_child.resolution_criteria) {
      sections.push({
        title: t("childResolutionCriteria"),
        markdown: condition_child.resolution_criteria,
      });
    }
    if (condition_child.fine_print) {
      sections.push({
        title: t("finePrint"),
        markdown: condition_child.fine_print,
      });
    }
    if (condition_child.description) {
      sections.push({
        title: t("childBackgroundInfo"),
        markdown: condition_child.description,
      });
    }
    return sections;
  }

  const resolution =
    post.group_of_questions?.resolution_criteria ??
    post.question?.resolution_criteria ??
    "";
  const finePrint =
    post.group_of_questions?.fine_print ?? post.question?.fine_print ?? "";
  const description =
    post.group_of_questions?.description ?? post.question?.description ?? "";

  const sections: MarkdownSection[] = [];
  if (resolution)
    sections.push({ title: t("resolutionCriteria"), markdown: resolution });
  if (finePrint) sections.push({ title: t("finePrint"), markdown: finePrint });
  if (description)
    sections.push({ title: t("backgroundInfo"), markdown: description });
  return sections;
};

const QuestionInfoTab: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const sections = useTextSections(post);

  const projectsData = post.projects;
  const allProjects = projectsData
    ? [
        ...(projectsData.index ?? []),
        ...(projectsData.tournament ?? []),
        ...(projectsData.question_series ?? []),
        ...(projectsData.community ?? []),
        ...(projectsData.category ?? []),
        ...(projectsData.leaderboard_tag ?? []),
      ]
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

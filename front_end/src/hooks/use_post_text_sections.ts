import { useTranslations } from "next-intl";

import { PostWithForecasts } from "@/types/post";

export type PostTextSection = { title: string; markdown: string };

export function usePostTextSections(
  post: PostWithForecasts,
  { excludeFinePrint = false } = {}
): PostTextSection[] {
  const t = useTranslations();

  if (post.conditional) {
    const { condition, condition_child } = post.conditional;
    const sections: PostTextSection[] = [];
    if (condition.resolution_criteria)
      sections.push({
        title: t("parentResolutionCriteria"),
        markdown: condition.resolution_criteria,
      });
    if (!excludeFinePrint && condition.fine_print)
      sections.push({ title: t("finePrint"), markdown: condition.fine_print });
    if (condition.description)
      sections.push({
        title: t("parentBackgroundInfo"),
        markdown: condition.description,
      });
    if (condition_child.resolution_criteria)
      sections.push({
        title: t("childResolutionCriteria"),
        markdown: condition_child.resolution_criteria,
      });
    if (!excludeFinePrint && condition_child.fine_print)
      sections.push({
        title: t("finePrint"),
        markdown: condition_child.fine_print,
      });
    if (condition_child.description)
      sections.push({
        title: t("childBackgroundInfo"),
        markdown: condition_child.description,
      });
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

  const sections: PostTextSection[] = [];
  if (resolution)
    sections.push({ title: t("resolutionCriteria"), markdown: resolution });
  if (!excludeFinePrint && finePrint)
    sections.push({ title: t("finePrint"), markdown: finePrint });
  if (description)
    sections.push({ title: t("backgroundInfo"), markdown: description });
  return sections;
}

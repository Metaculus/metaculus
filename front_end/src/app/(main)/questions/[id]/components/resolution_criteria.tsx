import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { Post } from "@/types/post";

const MAX_COLLAPSED_HEIGHT = 256;

type Props = {
  post: Post;
};

const ResolutionCriteria: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");

  if (post.conditional) {
    const { condition, condition_child } = post.conditional;

    return (
      <div className="my-4 flex flex-col gap-2.5">
        <SectionToggle title={t("parentResolutionCriteria")}>
          <ExpandableContent
            maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            className="-mt-4"
          >
            <h4 className="mb-0 font-sans italic">{condition.title}</h4>
            {!!condition.resolution_criteria && (
              <MarkdownEditor markdown={condition.resolution_criteria} />
            )}
            {!!condition.fine_print && (
              <>
                <h3 className="text-base font-normal leading-5 opacity-70">
                  {t("finePrint")}
                </h3>
                <MarkdownEditor
                  markdown={condition.fine_print}
                  contentEditableClassName="!font-sans opacity-70"
                />
              </>
            )}
          </ExpandableContent>
        </SectionToggle>

        <SectionToggle title={t("childResolutionCriteria")}>
          <ExpandableContent
            maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            className="-mt-4"
          >
            <h4 className="mb-0 font-sans italic">{condition_child.title}</h4>
            {!!condition_child.resolution_criteria && (
              <MarkdownEditor markdown={condition_child.resolution_criteria} />
            )}
            {!!condition_child.fine_print && (
              <>
                <h3 className="text-base font-normal leading-5 opacity-70">
                  {t("finePrint")}
                </h3>
                <MarkdownEditor
                  markdown={condition_child.fine_print}
                  contentEditableClassName="!font-sans opacity-70"
                />
              </>
            )}
          </ExpandableContent>
        </SectionToggle>
      </div>
    );
  }

  const description =
    post.group_of_questions?.resolution_criteria ??
    post.question?.resolution_criteria ??
    "";
  const finePrint =
    post.group_of_questions?.fine_print ?? post.question?.fine_print ?? "";

  return (
    <SectionToggle title={t("resolutionCriteria")} wrapperClassName="my-4">
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <MarkdownEditor markdown={description} />
        {!!finePrint && (
          <>
            <h3 className="text-base font-normal leading-5 opacity-70">
              {t("finePrint")}
            </h3>
            <MarkdownEditor markdown={finePrint} />
          </>
        )}
      </ExpandableContent>
    </SectionToggle>
  );
};

export default ResolutionCriteria;

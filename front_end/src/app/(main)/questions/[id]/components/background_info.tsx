import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { Post } from "@/types/post";

const MAX_COLLAPSED_HEIGHT = 256;

type Props = {
  post: Post;
  defaultOpen?: boolean;
};

const BackgroundInfo: FC<Props> = ({ post, defaultOpen = true }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");

  if (post.conditional) {
    const { condition, condition_child } = post.conditional;

    return (
      <>
        <SectionToggle
          title={t("parentBackgroundInfo")}
          defaultOpen={defaultOpen}
        >
          <ExpandableContent
            maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            className="-mt-4"
          >
            <MarkdownEditor markdown={condition.description} />
          </ExpandableContent>
        </SectionToggle>
        <SectionToggle
          title={t("childBackgroundInfo")}
          defaultOpen={defaultOpen}
        >
          <ExpandableContent
            maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            className="-mt-4"
          >
            <MarkdownEditor markdown={condition_child.description} />
          </ExpandableContent>
        </SectionToggle>
      </>
    );
  }

  const description =
    post.group_of_questions?.description ?? post.question?.description ?? "";

  return (
    <SectionToggle title={t("backgroundInfo")} defaultOpen={defaultOpen}>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <MarkdownEditor markdown={description} />
      </ExpandableContent>
    </SectionToggle>
  );
};

export default BackgroundInfo;

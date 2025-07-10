"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { Post } from "@/types/post";

type Props = {
  post: Post;
};

const MAX_COLLAPSED_HEIGHT = 256;

export const CoherenceLinks: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");
  const [content, setContent] = useState<string>("");

  async function buttonClick() {
    const result = await createCoherenceLink();
    setContent(JSON.stringify(result));
    console.log("I was clicked!", result);
  }

  return (
    <SectionToggle title={"Question Links"} defaultOpen={true}>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <div id={"question-links"}>
          <button onClick={buttonClick}>Click me!</button>
          <div>{content}</div>
        </div>
      </ExpandableContent>
    </SectionToggle>
  );
};

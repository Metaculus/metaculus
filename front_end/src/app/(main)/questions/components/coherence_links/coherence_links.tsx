"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { CreateCoherenceLink } from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import Button from "@/components/ui/button";
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
  const [newLinksCount, setNewLinksCount] = useState(0);

  async function addLink() {
    setNewLinksCount(newLinksCount + 1);
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
          {Array.from({ length: newLinksCount }, (_, index) => (
            <CreateCoherenceLink
              post={post}
              key={index}
              linkKey={index}
            ></CreateCoherenceLink>
          ))}
        </div>
        <br />
        <Button onClick={addLink} className={"w-32"}>
          Link a question
        </Button>
      </ExpandableContent>
    </SectionToggle>
  );
};

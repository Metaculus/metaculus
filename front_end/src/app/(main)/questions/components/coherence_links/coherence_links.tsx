"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { getCoherenceLinksForQuestion } from "@/app/(main)/questions/actions";
import { CreateCoherenceLink } from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import Button from "@/components/ui/button";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
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
  const [coherenceLinks, setCoherenceLinks] = useState<string>("");
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);

  async function addLink() {
    setNewLinksCount(newLinksCount + 1);
  }

  async function updatePage() {
    console.log("Page update");
    if (!post.question) return;
    const coherenceLinks = await getCoherenceLinksForQuestion(post.question);
    console.log(coherenceLinks);
    setCoherenceLinks(JSON.stringify(coherenceLinks));
  }

  useEffect(() => {
    updatePage().then(() => {});
  });

  return (
    <SectionToggle title={"Question Links"} defaultOpen={true}>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        {coherenceLinks}
        <div id={"question-links"}>
          {Array.from({ length: newLinksCount }, (_, index) => (
            <CreateCoherenceLink
              post={post}
              key={index}
              linkCreated={updatePage}
            ></CreateCoherenceLink>
          ))}
        </div>
        <br />
        {isLoggedIn && (
          <Button onClick={addLink} className={"w-32"}>
            Link a question
          </Button>
        )}
      </ExpandableContent>
    </SectionToggle>
  );
};

"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { CreateCoherenceLink } from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import { DisplayCoherenceLink } from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import Button from "@/components/ui/button";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import ClientCoherenceLinksApi from "@/services/api/coherence_links/coherence_links.client";
import { CoherenceLinksGroup } from "@/types/coherence";
import { Post } from "@/types/post";
import { QuestionType } from "@/types/question";

type Props = {
  post: Post;
};

const MAX_COLLAPSED_HEIGHT = 256;

export const CoherenceLinks: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");
  const [newLinksCount, setNewLinksCount] = useState(0);
  const [coherenceLinks, setCoherenceLinks] =
    useState<CoherenceLinksGroup | null>(null);
  const toggleOpenRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      setNewLinksCount(0);
    }
  }, []);
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);

  async function addLink() {
    setNewLinksCount(newLinksCount + 1);
  }

  const updatePage = async () => {
    ClientCoherenceLinksApi.getCoherenceLinksForPost(post)
      .then((links) => setCoherenceLinks(links))
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    void updatePage();
  }, []);

  if (post.question?.type !== QuestionType.Binary) return null;

  return (
    <SectionToggle title={t("questionLinks")} defaultOpen={true}>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <div ref={toggleOpenRef}>
          <div>
            {Array.from(coherenceLinks?.data ?? [], (link, index) => (
              <DisplayCoherenceLink
                key={index}
                link={link}
                post={post}
                compact={false}
              ></DisplayCoherenceLink>
            ))}
          </div>

          <div className={"m-4"}>
            {(!coherenceLinks || coherenceLinks.size === 0) &&
              newLinksCount === 0 && <div>{t("noQuestionsLinked")}</div>}
          </div>

          <div>
            {Array.from({ length: newLinksCount }, (_, index) => (
              <CreateCoherenceLink
                post={post}
                key={index}
                linkCreated={updatePage}
              ></CreateCoherenceLink>
            ))}
          </div>
          <div className={"m-2"}>
            {isLoggedIn && (
              <Button onClick={addLink} className={"w-32"}>
                {t("linkQuestion")}
              </Button>
            )}
          </div>
        </div>
      </ExpandableContent>
    </SectionToggle>
  );
};

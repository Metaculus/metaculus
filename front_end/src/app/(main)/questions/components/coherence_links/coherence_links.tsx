"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

const MAX_COLLAPSED_HEIGHT = 9999;

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
    <SectionToggle title={t("questionLinksPrivate")} defaultOpen={true}>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <div ref={toggleOpenRef} className="mt-3 flex flex-col gap-3">
          {Array.from(coherenceLinks?.data ?? [], (link) => (
            <DisplayCoherenceLink
              key={link.id}
              link={link}
              post={post}
              compact={false}
            ></DisplayCoherenceLink>
          ))}

          {Array.from({ length: newLinksCount }, (_, index) => (
            <CreateCoherenceLink
              post={post}
              key={index}
              linkCreated={updatePage}
            ></CreateCoherenceLink>
          ))}

          {(!coherenceLinks || coherenceLinks.size === 0) &&
            newLinksCount === 0 && (
              <div className="pt-2 opacity-50">{t("noQuestionsLinked")}</div>
            )}

          {isLoggedIn && (
            <Button onClick={addLink} variant="tertiary" className="self-start">
              <FontAwesomeIcon icon={faPlus} className="size-4" />
              {t("linkQuestion")}
            </Button>
          )}
        </div>
      </ExpandableContent>
    </SectionToggle>
  );
};

"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { AddButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import CreateCoherenceLink from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import DisplayCoherenceLink from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { ALLOWED_COHERENCE_LINK_QUESTION_TYPES } from "@/types/coherence";
import { Post } from "@/types/post";

type Props = {
  post: Post;
};

const MAX_COLLAPSED_HEIGHT = 9999;

export const CoherenceLinks: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");
  const [newLinks, setNewLinks] = useState<number[]>([]);
  const { coherenceLinks, updateCoherenceLinks } = useCoherenceLinksContext();
  const toggleOpenRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      setNewLinks([]);
    }
  }, []);
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);

  async function addLink() {
    setNewLinks([...newLinks, (newLinks?.at(-1) ?? -1) + 1]);
  }

  async function deleteLink(key: number) {
    setNewLinks((prevLinks) => prevLinks.filter((current) => current !== key));
  }

  useEffect(() => {
    void updateCoherenceLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questionType = post.question?.type;

  if (
    !isLoggedIn ||
    !questionType ||
    !ALLOWED_COHERENCE_LINK_QUESTION_TYPES.includes(questionType)
  )
    return null;

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

          {Array.from(newLinks, (id) => (
            <CreateCoherenceLink
              post={post}
              key={id}
              linkKey={id}
              deleteLink={deleteLink}
            ></CreateCoherenceLink>
          ))}

          <div className="flex flex-col items-center justify-between gap-3 px-0 md:px-20">
            {(!coherenceLinks || coherenceLinks.data.length === 0) &&
              newLinks?.length === 0 && (
                <div className="flex flex-col items-center justify-between gap-2 pt-3">
                  <span className="text-balance text-center text-sm">
                    {t("noQuestionsLinkedP2")}
                  </span>
                  <span className="text-balance text-center text-sm">
                    {t("noQuestionsLinkedP3")}
                  </span>
                  <span className="mt-1 text-center text-sm text-blue-600 dark:text-blue-600-dark">
                    {t("noQuestionsLinkedP1")}
                  </span>
                </div>
              )}

            <AddButton onClick={addLink} className="mx-auto self-start">
              {t("linkQuestion")}
            </AddButton>
          </div>
        </div>
      </ExpandableContent>
    </SectionToggle>
  );
};

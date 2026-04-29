"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { AddButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import AddCoherenceLinkModal from "@/app/(main)/questions/components/coherence_links/add_coherence_link_modal";
import DisplayCoherenceLink from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import EmptyStateIllustration from "@/app/(main)/questions/components/coherence_links/empty_state_illustration";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { ALLOWED_COHERENCE_LINK_QUESTION_TYPES } from "@/types/coherence";
import { Post } from "@/types/post";
import cn from "@/utils/core/cn";

type Props = {
  post: Post;
};

const DownArrow: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 40"
    width="18"
    height="30"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={cn("mx-auto text-blue-700 dark:text-blue-700-dark", className)}
  >
    <line x1="12" y1="2" x2="12" y2="36" />
    <polyline points="5,28 12,36 19,28" />
  </svg>
);

const ListLabel: FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      "text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark",
      className
    )}
  >
    {children}
  </div>
);

export const CoherenceLinks: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { coherenceLinks } = useCoherenceLinksContext();
  const { user } = useAuth();
  const isLoggedIn = !isNil(user);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const questionType = post.question?.type;

  if (
    !isLoggedIn ||
    !questionType ||
    !ALLOWED_COHERENCE_LINK_QUESTION_TYPES.includes(questionType)
  )
    return null;

  const allLinks = coherenceLinks?.data ?? [];
  // Sort by id so rows don't jump around when the server re-sorts by updated_at
  // after an inline edit. Creation order is stable and user-intuitive here.
  const sortedLinks = [...allLinks].sort((a, b) => a.id - b.id);
  const incomingLinks = sortedLinks.filter(
    (link) => link.question2_id === post.question?.id
  );
  const outgoingLinks = sortedLinks.filter(
    (link) => link.question1_id === post.question?.id
  );
  const hasLinks = incomingLinks.length > 0 || outgoingLinks.length > 0;

  return (
    <SectionToggle
      title={t("questionLinksPrivate")}
      defaultOpen={true}
      detailElement={(isOpen) =>
        isOpen && hasLinks && !user?.is_bot ? (
          <AddButton
            as="div"
            className="ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddModalOpen(true);
            }}
          >
            {t("linkQuestion")}
          </AddButton>
        ) : null
      }
    >
      <div className="mt-3 flex flex-col gap-3 px-[25px]">
        {hasLinks ? (
          <>
            {incomingLinks.length > 0 && (
              <>
                <ListLabel className="mt-4">{t("influencedBy")}</ListLabel>
                <div className="flex flex-col gap-3">
                  {incomingLinks.map((link) => (
                    <DisplayCoherenceLink
                      key={link.id}
                      link={link}
                      post={post}
                      compact={false}
                    />
                  ))}
                </div>
                <DownArrow />
              </>
            )}

            <div className="rounded border border-blue-400 bg-gray-0 p-4 text-center font-semibold text-blue-700 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark">
              {post.title}
            </div>

            {outgoingLinks.length > 0 && (
              <>
                <DownArrow className="-mb-6 mt-2" />
                <ListLabel>{t("influences")}</ListLabel>
                <div className="flex flex-col gap-3">
                  {outgoingLinks.map((link) => (
                    <DisplayCoherenceLink
                      key={link.id}
                      link={link}
                      post={post}
                      compact={false}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center pb-6 text-center text-blue-700 dark:text-blue-700-dark">
            <EmptyStateIllustration />
            <p className="mt-6 max-w-md text-balance text-base">
              {t("noQuestionsLinkedP2")}
            </p>
            <p className="max-w-md text-balance text-sm">
              {t("noQuestionsLinkedP3")}
            </p>
            {!user?.is_bot && (
              <AddButton
                as="div"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddModalOpen(true);
                }}
              >
                {t("linkQuestion")}
              </AddButton>
            )}
          </div>
        )}
      </div>
      <AddCoherenceLinkModal
        post={post}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </SectionToggle>
  );
};

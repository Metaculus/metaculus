"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { FC, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import AddKeyFactorsModal from "@/app/(main)/questions/[id]/components/key_factors/add_modal";
import { useQuestionLayout } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import DisplayCoherenceLink from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import Button from "@/components/ui/button";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

import { getKeyFactorsLimits } from "./hooks";
import KeyFactorItem from "./key_factor_item";

type KeyFactorsSectionProps = {
  post: PostWithForecasts;
};

const AddKeyFactorsButton: FC<{
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}> = ({ onClick, className }) => {
  const t = useTranslations();
  return (
    <Button
      as="div"
      className={cn(
        "cursor-pointer gap-2 px-3 py-1 text-sm capitalize",
        className
      )}
      size="xs"
      variant="tertiary"
      onClick={(e) => onClick(e as React.MouseEvent<HTMLButtonElement>)}
    >
      <FontAwesomeIcon icon={faPlus} className="size-4 p-0" />
      {t("addKeyFactor")}
    </Button>
  );
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ post }) => {
  const postStatus = post.status;
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const [isAddKeyFactorsModalOpen, setIsAddKeyFactorsModalOpen] =
    useState(false);
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();
  const { keyFactorsExpanded } = useQuestionLayout();
  const { combinedKeyFactors } = useCommentsFeed();

  const { factorsLimit } = user?.id
    ? getKeyFactorsLimits(combinedKeyFactors, user?.id)
    : { factorsLimit: 0 };

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  if (
    [
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.PENDING_RESOLUTION,
    ].includes(postStatus) &&
    combinedKeyFactors.length === 0
  ) {
    return null;
  }

  const DetailElement =
    combinedKeyFactors.length > 0 &&
    factorsLimit > 0 &&
    ![
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.PENDING_RESOLUTION,
    ].includes(postStatus) ? (
      <AddKeyFactorsButton
        className="ml-auto"
        onClick={(event) => {
          event.preventDefault();
          sendAnalyticsEvent("addKeyFactor", {
            event_label: "fromList",
          });
          if (!user) {
            setCurrentModal({ type: "signin" });
            return;
          }
          setIsAddKeyFactorsModalOpen(true);
        }}
      />
    ) : null;

  const KeyFactors =
    combinedKeyFactors.length > 0 ? (
      <div id="key-factors-list" className="flex flex-col gap-2.5">
        <ExpandableContent
          maxCollapsedHeight={340}
          expandLabel={t("showMore")}
          collapseLabel={t("showLess")}
          forceState={keyFactorsExpanded}
        >
          <div className="flex flex-col gap-2.5">
            {combinedKeyFactors.map((kf) => (
              <div key={`post-key-factor-${kf.id}`} id={`key-factor-${kf.id}`}>
                <KeyFactorItem
                  keyFactor={kf}
                  projectPermission={post.user_permission}
                />
              </div>
            ))}
          </div>
        </ExpandableContent>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-between pb-8 pt-6">
        <span>{t("noKeyFactorsP1")}</span>
        <span className="mt-1 text-sm text-blue-600 dark:text-blue-600-dark">
          {t("noKeyFactorsP2")}
        </span>
        <AddKeyFactorsButton
          className="mx-auto mt-4"
          onClick={(event) => {
            event.preventDefault();
            if (!user) {
              setCurrentModal({ type: "signin" });
              return;
            }
            setIsAddKeyFactorsModalOpen(true);
          }}
        />
      </div>
    );

  const displayedAggregateLinks = aggregateCoherenceLinks?.data.filter(
    (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
  );

  return (
    <>
      {user && (
        <AddKeyFactorsModal
          isOpen={isAddKeyFactorsModalOpen}
          onClose={() => setIsAddKeyFactorsModalOpen(false)}
          post={post}
          user={user}
        />
      )}

      <SectionToggle
        detailElement={DetailElement}
        title={t("keyFactors")}
        defaultOpen
        id="key-factors"
        wrapperClassName="scroll-mt-header"
      >
        {KeyFactors}
        {posthog.getFeatureFlag("aggregate_question_links") &&
          displayedAggregateLinks?.length > 0 && (
            <>
              <div className="mb-2 mt-2 text-[16px] leading-[24px] text-blue-900 dark:text-blue-900-dark">
                Aggregate Question Links
              </div>
              {Array.from(
                displayedAggregateLinks,
                (link: FetchedAggregateCoherenceLink) => (
                  <div key={link.id}>
                    <DisplayCoherenceLink
                      link={link}
                      post={post}
                      compact={false}
                    ></DisplayCoherenceLink>
                    <br></br>
                  </div>
                )
              )}
            </>
          )}
      </SectionToggle>
    </>
  );
};

export default KeyFactorsSection;

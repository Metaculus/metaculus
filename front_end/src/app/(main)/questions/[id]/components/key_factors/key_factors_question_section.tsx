"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { AddKeyFactorsButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import AggregateCoherenceLinks from "@/app/(main)/questions/[id]/components/key_factors/aggregate_coherence_links";
import KeyFactorsFeed from "@/app/(main)/questions/[id]/components/key_factors/key_factors_feed";
import { useQuestionLayout } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { getKeyFactorsLimits } from "./hooks";

type KeyFactorsSectionProps = {
  post: PostWithForecasts;
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({ post }) => {
  const postStatus = post.status;
  const t = useTranslations();
  const { user } = useAuth();
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

  const showCreateButton =
    combinedKeyFactors.length > 0 &&
    factorsLimit > 0 &&
    ![
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.PENDING_RESOLUTION,
    ].includes(postStatus);

  return (
    <>
      <SectionToggle
        detailElement={
          showCreateButton ? (
            <AddKeyFactorsButton
              post={post}
              className="ml-auto"
              as="div"
              onClick={() =>
                sendAnalyticsEvent("addKeyFactor", {
                  event_label: "fromList",
                })
              }
            />
          ) : null
        }
        title={t("keyFactors")}
        defaultOpen
        id="key-factors"
        wrapperClassName="scroll-mt-header"
      >
        {combinedKeyFactors.length > 0 ? (
          <ExpandableContent
            maxCollapsedHeight={340}
            expandLabel={t("showMore")}
            collapseLabel={t("showLess")}
            forceState={keyFactorsExpanded}
          >
            <KeyFactorsFeed post={post} />
          </ExpandableContent>
        ) : (
          <KeyFactorsFeed post={post} />
        )}
        <AggregateCoherenceLinks post={post} />
      </SectionToggle>
    </>
  );
};

export default KeyFactorsSection;

"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { AddKeyFactorsButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import KeyFactorsFeed from "@/app/(main)/questions/[id]/components/key_factors/key_factors_feed";
import { useQuestionLayout } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { getKeyFactorsLimits } from "./hooks";

type KeyFactorsQuestionSectionProps = {
  post: PostWithForecasts;
};

const CLOSED_STATUSES: PostStatus[] = [
  PostStatus.CLOSED,
  PostStatus.RESOLVED,
  PostStatus.PENDING_RESOLUTION,
];

const KeyFactorsQuestionSection: FC<KeyFactorsQuestionSectionProps> = ({
  post,
}) => {
  const postStatus = post.status;
  const t = useTranslations();
  const { user } = useAuth();
  const { keyFactorsExpanded } = useQuestionLayout();
  const { combinedKeyFactors } = useCommentsFeed();

  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const questionLinkAggregates = useMemo(
    () =>
      aggregateCoherenceLinks?.data.filter(
        (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
      ) ?? [],
    [aggregateCoherenceLinks?.data]
  );

  const hasQuestionLinks = questionLinkAggregates.length > 0;

  const { factorsLimit } = user?.id
    ? getKeyFactorsLimits(combinedKeyFactors, user.id)
    : { factorsLimit: 0 };

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  if (
    CLOSED_STATUSES.includes(postStatus) &&
    combinedKeyFactors.length === 0 &&
    !hasQuestionLinks
  ) {
    return null;
  }

  const showCreateButton =
    (combinedKeyFactors.length > 0 || hasQuestionLinks) &&
    factorsLimit > 0 &&
    !CLOSED_STATUSES.includes(postStatus);

  return (
    <SectionToggle
      id="key-factors-section-toggle"
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
    </SectionToggle>
  );
};

export default KeyFactorsQuestionSection;

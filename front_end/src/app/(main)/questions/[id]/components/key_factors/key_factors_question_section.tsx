"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { AddKeyFactorsButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import KeyFactorsFeed from "@/app/(main)/questions/[id]/components/key_factors/key_factors_feed";
import { useQuestionLayout } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import { openFlowCommentsAndScrollToComment } from "@/app/(prediction-flow)/helpers";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { getKeyFactorsLimits } from "./hooks";
import { useTopKeyFactorsCarouselItems } from "./hooks/use_top_key_factors_carousel_items";
import KeyFactorsConsumerCarousel from "./key_factors_consumer_carousel";
import { useShouldHideKeyFactors } from "./use_should_hide_key_factors";

type KeyFactorsQuestionSectionProps = {
  post: PostWithForecasts;
  variant?: "default" | "flow";
};

const CLOSED_STATUSES: PostStatus[] = [
  PostStatus.CLOSED,
  PostStatus.RESOLVED,
  PostStatus.PENDING_RESOLUTION,
];

const KeyFactorsQuestionSection: FC<KeyFactorsQuestionSectionProps> = ({
  post,
  variant = "default",
}) => {
  const isFlow = variant === "flow";

  const postStatus = post.status;
  const t = useTranslations();
  const { user } = useAuth();
  const { keyFactorsExpanded } = useQuestionLayout();
  const { combinedKeyFactors } = useCommentsFeed();
  const shouldHideKeyFactors = useShouldHideKeyFactors();
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const questionLinkAggregates = useMemo(
    () =>
      aggregateCoherenceLinks?.data.filter(
        (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
      ) ?? [],
    [aggregateCoherenceLinks?.data]
  );

  const hasQuestionLinks = questionLinkAggregates.length > 0;

  const totalCount = useMemo(
    () => combinedKeyFactors.length + questionLinkAggregates.length,
    [combinedKeyFactors.length, questionLinkAggregates.length]
  );

  const { factorsLimit } = user?.id
    ? getKeyFactorsLimits(combinedKeyFactors, user.id)
    : { factorsLimit: 0 };

  const { items: topItems } = useTopKeyFactorsCarouselItems({
    keyFactors: combinedKeyFactors,
    sortMode: isFlow ? "strength" : "freshness",
  });

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  if (shouldHideKeyFactors) return null;

  if (
    CLOSED_STATUSES.includes(postStatus) &&
    combinedKeyFactors.length === 0 &&
    !hasQuestionLinks
  ) {
    return null;
  }

  const showCreateButton =
    !isFlow &&
    (combinedKeyFactors.length > 0 || hasQuestionLinks) &&
    factorsLimit > 0 &&
    !CLOSED_STATUSES.includes(postStatus);

  const sectionTitle = isFlow
    ? `${t("keyFactors")} (${totalCount})`
    : t("keyFactors");

  const shouldDefaultOpen = !isFlow || totalCount > 0;

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
      title={sectionTitle}
      defaultOpen={shouldDefaultOpen}
      wrapperClassName="scroll-mt-header"
    >
      {isFlow ? (
        topItems.length > 0 ? (
          <KeyFactorsConsumerCarousel
            post={post}
            items={topItems}
            lightVariant
            onKeyFactorClick={(kf) =>
              openFlowCommentsAndScrollToComment(kf.comment_id)
            }
          />
        ) : null
      ) : combinedKeyFactors.length > 0 ? (
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

"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { KeyFactor } from "@/types/comment";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { AddKeyFactorsButton } from "./add_button";
import KeyFactorsAddModal from "./add_modal/key_factors_add_modal";
import { getKeyFactorsLimits } from "./hooks";
import { KeyFactorItem } from "./item_view";
import KeyFactorsGridPlaceholder from "./key_factors_grid_placeholder";
import { useQuestionLayoutSafe } from "../question_layout/question_layout_context";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";
import KeyFactorDetailOverlay from "./key_factor_detail_overlay";

const GRID_PLACEHOLDER_SLOTS = 3;

type Props = {
  post: PostWithForecasts;
  truncateText?: boolean;
  hideOverlay?: boolean;
};

const KeyFactorsFeed: FC<Props> = ({ post, truncateText, hideOverlay }) => {
  const t = useTranslations();
  const { combinedKeyFactors, comments } = useCommentsFeed();
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const questionLayout = useQuestionLayoutSafe();
  const [order, setOrder] = useState<number[] | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const keyFactorOverlay = questionLayout?.keyFactorOverlay ?? null;
  const selectedKeyFactor =
    keyFactorOverlay?.kind === "keyFactor" ? keyFactorOverlay.keyFactor : null;
  const selectedQuestionLink =
    keyFactorOverlay?.kind === "questionLink" ? keyFactorOverlay.link : null;

  const setSelectedKeyFactor = (kf: KeyFactor | null) => {
    if (kf) {
      questionLayout?.openKeyFactorOverlay(kf);
    } else {
      questionLayout?.closeKeyFactorOverlay();
    }
  };
  const setSelectedQuestionLink = (
    link: FetchedAggregateCoherenceLink | null
  ) => {
    if (link) {
      questionLayout?.openQuestionLinkOverlay(link);
    } else {
      questionLayout?.closeKeyFactorOverlay();
    }
  };

  const questionLinkAggregates =
    aggregateCoherenceLinks?.data.filter(
      (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
    ) ?? [];

  useEffect(() => {
    if (!combinedKeyFactors.length) return;

    setOrder((prev) => {
      if (!prev || prev.length === 0) {
        const randomizedIds = [...combinedKeyFactors]
          .sort(
            (a, b) =>
              Math.random() / (a.freshness + 1) -
              Math.random() / (b.freshness + 1)
          )
          .map((kf) => kf.id);
        return randomizedIds;
      }

      const existing = new Set(prev);
      const newIds = combinedKeyFactors
        .map((kf) => kf.id)
        .filter((id) => !existing.has(id));

      return newIds.length ? [...prev, ...newIds] : prev;
    });
  }, [combinedKeyFactors]);

  const items = (order ?? combinedKeyFactors.map((kf) => kf.id))
    .map((id) => combinedKeyFactors.find((kf) => kf.id === id))
    .filter(Boolean) as typeof combinedKeyFactors;

  const totalItemCount = items.length + questionLinkAggregates.length;

  const isClosed = [
    PostStatus.CLOSED,
    PostStatus.RESOLVED,
    PostStatus.PENDING_RESOLUTION,
  ].includes(post.status);

  const { factorsLimit } = user?.id
    ? getKeyFactorsLimits(combinedKeyFactors, user.id)
    : { factorsLimit: 0 };

  const canAddKeyFactor = factorsLimit > 0 && !isClosed;

  const handleAddClick = () => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    setIsAddModalOpen(true);
    sendAnalyticsEvent("addKeyFactor", {
      event_label: "fromPlaceholder",
    });
  };

  const handleKeyFactorClick = (kf: KeyFactor) => {
    setSelectedKeyFactor(kf);
    sendAnalyticsEvent("KeyFactorClick", { event_label: "fromGrid" });
  };

  const handleQuestionLinkClick = (link: FetchedAggregateCoherenceLink) => {
    setSelectedQuestionLink(link);
    sendAnalyticsEvent("KeyFactorClick", { event_label: "questionLink" });
  };

  const preloadedComment = useMemo(
    () =>
      selectedKeyFactor
        ? comments
            .flatMap((c) => [c, ...(c.children ?? [])])
            .find((c) => c.id === selectedKeyFactor.comment_id) ?? null
        : null,
    [comments, selectedKeyFactor]
  );

  const addModal = user && (
    <KeyFactorsAddModal
      isOpen={isAddModalOpen}
      onClose={() => setIsAddModalOpen(false)}
      post={post}
      user={user}
    />
  );

  const overlay = hideOverlay ? null : selectedKeyFactor ? (
    <KeyFactorDetailOverlay
      keyFactor={selectedKeyFactor}
      allKeyFactors={combinedKeyFactors}
      post={post}
      preloadedComment={preloadedComment}
      onClose={() => setSelectedKeyFactor(null)}
      onSelectKeyFactor={setSelectedKeyFactor}
    />
  ) : selectedQuestionLink ? (
    <KeyFactorDetailOverlay
      key={selectedQuestionLink.id}
      questionLink={selectedQuestionLink}
      post={post}
      onClose={() => setSelectedQuestionLink(null)}
    />
  ) : null;

  if (totalItemCount === 0) {
    return (
      <>
        <div
          className="flex flex-col items-center gap-4 pb-8 pt-6"
          id="key-factors"
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-base font-medium leading-6 text-blue-800 dark:text-blue-800-dark">
              {t("noKeyFactorsP1")}
            </span>
            <span className="text-sm leading-5 text-blue-600 dark:text-blue-600-dark">
              {t("noKeyFactorsP2")}
            </span>
          </div>
          {canAddKeyFactor && <AddKeyFactorsButton post={post} as="div" />}
        </div>
        {addModal}
      </>
    );
  }

  if (totalItemCount <= GRID_PLACEHOLDER_SLOTS) {
    const placeholderCount = GRID_PLACEHOLDER_SLOTS - totalItemCount;

    return (
      <>
        <div
          className="grid grid-cols-2 gap-2.5 md:grid-cols-3"
          id="key-factors"
        >
          {items.map((kf) => (
            <KeyFactorItem
              id={`key-factor-${kf.id}`}
              key={`post-key-factor-${kf.id}`}
              keyFactor={kf}
              projectPermission={post.user_permission}
              truncateText={truncateText}
              onClick={() => handleKeyFactorClick(kf)}
            />
          ))}

          {questionLinkAggregates.map((link) => (
            <QuestionLinkKeyFactorItem
              id={`question-link-kf-${link.id}`}
              key={`question-link-kf-${link.id}`}
              link={link}
              post={post}
              titleLinksToQuestion={false}
              onClick={() => handleQuestionLinkClick(link)}
            />
          ))}

          {!isClosed &&
            Array.from({ length: placeholderCount }).map((_, i) => (
              <KeyFactorsGridPlaceholder
                key={`placeholder-${i}`}
                className={i < 2 - totalItemCount ? "" : "hidden md:flex"}
                onClick={
                  i === 0 && canAddKeyFactor ? handleAddClick : undefined
                }
              />
            ))}
        </div>

        {addModal}
        {overlay}
      </>
    );
  }

  return (
    <>
      <div className="columns-2 gap-2.5 md:columns-3" id="key-factors">
        {items.map((kf) => (
          <div
            key={`post-key-factor-${kf.id}`}
            className="mb-2 break-inside-avoid"
          >
            <KeyFactorItem
              id={`key-factor-${kf.id}`}
              keyFactor={kf}
              projectPermission={post.user_permission}
              onClick={() => handleKeyFactorClick(kf)}
            />
          </div>
        ))}

        {questionLinkAggregates.map((link) => (
          <div
            key={`question-link-kf-${link.id}`}
            className="mb-2 break-inside-avoid"
          >
            <QuestionLinkKeyFactorItem
              id={`question-link-kf-${link.id}`}
              link={link}
              post={post}
              titleLinksToQuestion={false}
              onClick={() => handleQuestionLinkClick(link)}
            />
          </div>
        ))}
      </div>
      {overlay}
    </>
  );
};

export default KeyFactorsFeed;

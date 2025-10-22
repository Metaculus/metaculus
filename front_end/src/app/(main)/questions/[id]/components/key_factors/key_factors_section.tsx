"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useKeyFactorsContext } from "@/app/(main)/questions/[id]/components/key_factors/key_factors_provider";
import Button from "@/components/ui/button";
import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

import AggregateCoherenceLinks from "./aggregate_coherence_links";
import { getKeyFactorsLimits } from "./hooks";
import KeyFactorsFeed from "./key_factors_feed";

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
  const { forceExpandedState, setIsAddModalOpen } = useKeyFactorsContext();

  // TODO: move this to the KeyFactors Provider!
  const { combinedKeyFactors } = useCommentsFeed();

  const { factorsLimit } = user?.id
    ? getKeyFactorsLimits(combinedKeyFactors, user?.id)
    : { factorsLimit: 0 };

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
          setIsAddModalOpen(true);
        }}
      />
    ) : null;

  return (
    <SectionToggle
      detailElement={DetailElement}
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
          forceState={forceExpandedState}
        >
          <KeyFactorsFeed post={post} />
        </ExpandableContent>
      ) : (
        <KeyFactorsFeed post={post} />
      )}
      <AggregateCoherenceLinks post={post} />
    </SectionToggle>
  );
};

export default KeyFactorsSection;

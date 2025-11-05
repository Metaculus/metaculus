"use client";

import {
  faCaretUp,
  faChevronDown,
  faChevronUp,
  faDiagramProject,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";

import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/item_view";
import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { BECommentType, KeyFactor } from "@/types/comment";
import { parseUserMentions } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import { formatUsername } from "@/utils/formatters/users";

import SquareArrowUpRight from "./SquareArrowUpRight";

type Props = {
  comment: BECommentType;
  votesScore: number;
  changedMyMindCount: number;
  keyFactorVotesScore: number;
  className?: string;
  expandOverride?: "auto" | "expanded" | "collapsed";
};

const BottomStatContainer: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm border border-gray-300 px-2.5 py-1 dark:border-gray-300-dark",
        className
      )}
    >
      {children}
    </div>
  );
};

const KeyFactors = ({ keyFactors }: { keyFactors: KeyFactor[] }) => {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-xs font-normal uppercase leading-4 text-gray-600 dark:text-gray-600-dark">
        {t("keyFactors")}
      </div>

      <KeyFactorsCarousel
        items={keyFactors}
        renderItem={(kf) => (
          <KeyFactorItem keyFactor={kf} isCompact={true} mode={"consumer"} />
        )}
      />
    </div>
  );
};

const ExpandableCommentContent = ({
  comment,
  isExpanded,
  needsExpand,
  contentRef,
}: {
  comment: BECommentType;
  isExpanded: boolean;
  needsExpand: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const locale = useLocale();

  // Fixed height for collapsed state - adjust this value as needed
  const COLLAPSED_HEIGHT = 200; // pixels

  return (
    <div
      ref={contentRef}
      className="relative flex flex-col gap-[10px] overflow-hidden p-3 md:p-4"
      style={{
        height: !isExpanded && needsExpand ? `${COLLAPSED_HEIGHT}px` : "auto",
      }}
    >
      {/* Author info */}
      <div className="flex items-center gap-1.5">
        <Link
          href={`/accounts/profile/${comment.author.id}/`}
          className="text-base font-bold leading-6 text-gray-800 no-underline hover:underline dark:text-gray-800-dark"
        >
          {formatUsername(comment.author)}
        </Link>
        <span
          className="text-base font-normal leading-6 text-gray-500 dark:text-gray-500-dark"
          suppressHydrationWarning
        >
          on {formatDate(locale, new Date(comment.created_at))}
        </span>
      </div>

      {/* Comment text */}
      <div className="mb-4 text-base font-normal leading-6 text-gray-700 dark:text-gray-700-dark">
        <MarkdownEditor
          markdown={parseUserMentions(comment.text, comment.mentioned_users)}
          mode="read"
          withUgcLinks
          withTwitterPreview
          withCodeBlocks
        />

        {comment.key_factors && comment.key_factors.length > 0 && (
          <KeyFactors keyFactors={comment.key_factors} />
        )}
      </div>

      {/* Gradient overlay for collapsed state */}
      {!isExpanded && needsExpand && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-white dark:from-transparent dark:to-gray-0-dark" />
      )}
    </div>
  );
};

const CommentCard: FC<Props> = ({
  comment,
  className,
  votesScore,
  changedMyMindCount,
  keyFactorVotesScore,
  expandOverride = "auto",
}) => {
  const t = useTranslations();
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsExpand, setNeedsExpand] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [localExpanded, setLocalExpanded] = useState<boolean | null>(null);

  useEffect(() => {
    setLocalExpanded(null);
  }, [expandOverride]);

  const controlledExpanded =
    expandOverride === "expanded"
      ? true
      : expandOverride === "collapsed"
        ? false
        : undefined;

  const effectiveExpanded = localExpanded ?? controlledExpanded ?? isExpanded;

  // Fixed height threshold - adjust this value as needed
  const HEIGHT_THRESHOLD = 10; // pixels

  useEffect(() => {
    const measureHeight = () => {
      if (contentRef.current) {
        // Temporarily expand to measure full height
        const originalHeight = contentRef.current.style.height;
        const originalOverflow = contentRef.current.style.overflow;

        contentRef.current.style.height = "auto";
        contentRef.current.style.overflow = "visible";

        const fullHeight = contentRef.current.scrollHeight;
        const shouldExpand = fullHeight > HEIGHT_THRESHOLD;

        setNeedsExpand(shouldExpand);
        if (controlledExpanded === undefined) {
          setIsExpanded(!shouldExpand);
        }
        // Restore original styles
        contentRef.current.style.height = originalHeight;
        contentRef.current.style.overflow = originalOverflow;
      }
    };

    // Use setTimeout to ensure content is fully rendered
    const timeoutId = setTimeout(measureHeight, 100);

    return () => clearTimeout(timeoutId);
  }, [comment.text, comment.key_factors, comment.id, controlledExpanded]);

  const handleGoToComment = () => {
    if (comment.on_post_data) {
      window.open(
        `/questions/${comment.on_post_data.id}#comment-${comment.id}`,
        "_blank"
      );
    }
  };

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-white  dark:bg-gray-0-dark",
        className
      )}
    >
      {/* Question context */}
      {comment.on_post_data && (
        <div className="flex flex-col gap-1.5 border-b border-gray-300 p-3 dark:border-gray-300-dark md:p-4">
          <div className="text-xs font-normal uppercase leading-4 text-gray-500 dark:text-gray-500-dark">
            {t("question")}
          </div>

          <Link
            href={`/questions/${comment.on_post_data.id}`}
            className="text-sm font-normal leading-5 text-blue-700 no-underline hover:underline dark:text-blue-700-dark md:text-base"
          >
            {comment.on_post_data.title}
          </Link>
        </div>
      )}

      {/* Expandable comment content */}
      <ExpandableCommentContent
        comment={comment}
        isExpanded={effectiveExpanded}
        needsExpand={needsExpand}
        contentRef={contentRef}
      />

      <div className="flex items-center justify-between p-3 md:p-4">
        {/* Comment votes, change my mind and key factors */}
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500-dark">
          <BottomStatContainer className=" gap-1.5 text-gray-500 dark:text-gray-500-dark">
            <FontAwesomeIcon icon={faChevronUp} className={cn(``)} />
            <span>{votesScore}</span>
            <FontAwesomeIcon icon={faChevronDown} className={cn(``)} />
          </BottomStatContainer>

          {changedMyMindCount > 0 && (
            <BottomStatContainer className="leading-[114%]">
              <FontAwesomeIcon
                icon={faCaretUp}
                className="mr-2 text-gray-500 dark:text-gray-500-dark"
              />
              <span>{changedMyMindCount} </span>
              <span className="ml-1 hidden text-nowrap md:block">
                {t("mindsChanged")}
              </span>
            </BottomStatContainer>
          )}
          {keyFactorVotesScore > 0 && (
            <BottomStatContainer className="leading-[114%]">
              <FontAwesomeIcon
                icon={faDiagramProject}
                className="mr-2 text-gray-500 dark:text-gray-500-dark"
              />
              <span>{parseFloat(keyFactorVotesScore.toFixed(2))}</span>
              <span className="ml-1 hidden text-nowrap md:block">
                {t("keyFactorImpact")}
              </span>
            </BottomStatContainer>
          )}
        </div>

        {needsExpand ? (
          <div className="flex items-center gap-2">
            <BottomStatContainer
              className={
                effectiveExpanded
                  ? "p-1 md:px-2.5 md:py-1"
                  : "border-blue-500 dark:border-blue-500-dark"
              }
            >
              <Button
                variant="text"
                size="sm"
                onClick={() =>
                  setLocalExpanded(effectiveExpanded ? false : true)
                }
                className="p-0"
              >
                <FontAwesomeIcon
                  icon={effectiveExpanded ? faChevronUp : faChevronDown}
                  className="text-blue-600 dark:text-blue-600-dark"
                />
                {effectiveExpanded ? "Collapse" : "Expand"}
              </Button>
            </BottomStatContainer>

            {effectiveExpanded && (
              <BottomStatContainer className="p-1 md:px-2.5 md:py-1">
                <Button
                  size="sm"
                  variant="text"
                  onClick={handleGoToComment}
                  className="p-0"
                >
                  <SquareArrowUpRight className="size-[14px] md:size-[11px]" />
                  <span className="hidden md:block">View comment</span>
                </Button>
              </BottomStatContainer>
            )}
          </div>
        ) : (
          <BottomStatContainer className="p-1 md:px-2.5 md:py-1">
            <Button
              size="sm"
              variant="text"
              onClick={handleGoToComment}
              className="p-0"
            >
              <SquareArrowUpRight className="size-[14px] md:size-[11px]" />
              <span className="hidden md:block">View comment</span>
            </Button>
          </BottomStatContainer>
        )}
      </div>
    </div>
  );
};

export default CommentCard;

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
  onViewComment?: () => void;
};

// Fixed height for collapsed state - adjust this value as needed
const COLLAPSED_HEIGHT = 174; // pixels

const BottomStatContainer: FC<
  PropsWithChildren<{ className?: string; title?: string }>
> = ({ children, className, title }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-sm border border-gray-300 px-2.5 py-0.5 dark:border-gray-300-dark",
        className
      )}
      title={title}
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
        gapClassName="gap-1"
        renderItem={(kf) => (
          <KeyFactorItem
            keyFactor={kf}
            isCompact={true}
            mode={"consumer"}
            linkToComment={false}
            className="w-[190px]"
          />
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
  onViewComment,
}: {
  comment: BECommentType;
  isExpanded: boolean;
  needsExpand: boolean;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onViewComment?: () => void;
}) => {
  const locale = useLocale();
  const t = useTranslations();

  return (
    <div
      ref={contentRef}
      className="relative flex flex-col gap-[10px] overflow-hidden p-3 md:p-4"
      style={{
        height: !isExpanded && needsExpand ? `${COLLAPSED_HEIGHT}px` : "auto",
      }}
    >
      {/* Author info */}
      <div className="flex items-start justify-between gap-1.5 text-gray-500 dark:text-gray-500-dark">
        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <Link
            href={`/accounts/profile/${comment.author.id}/`}
            className="truncate text-base font-bold leading-6 text-gray-800 no-underline hover:underline dark:text-gray-800-dark"
          >
            {formatUsername(comment.author)}
          </Link>
          ·
          <span
            className="shrink-0 text-base font-normal leading-6"
            suppressHydrationWarning
          >
            {t("onDate", {
              date: formatDate(locale, new Date(comment.created_at)),
            })}
          </span>
        </div>
        {onViewComment && (
          <Button
            variant="text"
            onClick={onViewComment}
            size="sm"
            className="gap-2 border-none px-2.5 py-1 font-normal text-blue-700 dark:text-blue-700-dark"
          >
            <SquareArrowUpRight className="size-[14px] text-blue-600 dark:text-blue-600-dark md:size-[11px]" />
            <span className="leading-4">{t("view")}</span>
          </Button>
        )}
      </div>

      {/* Comment text */}
      <div className="mb-4 text-base font-normal leading-6 text-gray-700 dark:text-gray-700-dark [&:has(.mdxeditor)>.comment-skeleton]:hidden">
        <MarkdownEditor
          markdown={parseUserMentions(comment.text, comment.mentioned_users)}
          mode="read"
          contentEditableClassName="[&>*:first-child]:mt-0"
          withUgcLinks
          withTwitterPreview
          withCodeBlocks
        />
        <div className="comment-skeleton flex flex-col gap-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
        </div>

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
  onViewComment,
}) => {
  const t = useTranslations();
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsExpand, setNeedsExpand] = useState(true);
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

  useEffect(() => {
    const measureHeight = () => {
      if (contentRef.current) {
        const originalHeight = contentRef.current.style.height;
        const originalOverflow = contentRef.current.style.overflow;

        contentRef.current.style.height = "auto";
        contentRef.current.style.overflow = "visible";

        const fullHeight = contentRef.current.scrollHeight;
        const shouldExpand = fullHeight > COLLAPSED_HEIGHT;

        setNeedsExpand(shouldExpand);
        if (controlledExpanded === undefined) {
          setIsExpanded(!shouldExpand);
        }

        contentRef.current.style.height = originalHeight;
        contentRef.current.style.overflow = originalOverflow;
      }
    };

    // Re-measure when the markdown editor finishes loading
    const node = contentRef.current;
    if (!node) return;

    // Check if .mdxeditor is already rendered
    if (node.querySelector(".mdxeditor")) {
      measureHeight();
      return;
    }

    const observer = new MutationObserver(() => {
      if (node.querySelector(".mdxeditor")) {
        measureHeight();
        observer.disconnect();
      }
    });
    observer.observe(node, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [comment.text, comment.key_factors, comment.id, controlledExpanded]);

  return (
    <div
      className={cn(
        "flex h-full w-full  flex-col overflow-hidden bg-white dark:bg-gray-0-dark",
        className
      )}
    >
      {/* Question context for mobile */}
      {comment.on_post_data && (
        <div className="mt-3 flex flex-col gap-1.5 border-y border-gray-300 p-3 dark:border-gray-300-dark md:hidden md:p-4">
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
        onViewComment={onViewComment}
      />

      <div className="mt-auto flex items-center justify-between p-3 md:p-4">
        {/* Comment votes, change my mind and key factors */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500-dark">
          <BottomStatContainer
            className=" gap-1.5"
            title={t("searchOptionUpvotes")}
          >
            <FontAwesomeIcon
              icon={faChevronUp}
              className="text-gray-500/35 dark:text-gray-500-dark/35"
            />
            <span>{votesScore}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="text-gray-500/35 dark:text-gray-500-dark/35"
            />
          </BottomStatContainer>

          {changedMyMindCount > 0 && (
            <BottomStatContainer title={t("mindsChanged")}>
              <FontAwesomeIcon
                icon={faCaretUp}
                className="mr-2 text-gray-500/35 dark:text-gray-500-dark/35"
              />
              <span>{changedMyMindCount} </span>
            </BottomStatContainer>
          )}
          {keyFactorVotesScore > 0 && (
            <BottomStatContainer title={t("keyFactorImpact")}>
              <FontAwesomeIcon
                icon={faDiagramProject}
                className="mr-2 text-gray-500/35 dark:text-gray-500-dark/35"
              />
              <span>{parseFloat(keyFactorVotesScore.toFixed(2))}</span>
            </BottomStatContainer>
          )}
        </div>

        {needsExpand ? (
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => setLocalExpanded(effectiveExpanded ? false : true)}
              className="flex items-center gap-2 rounded-sm px-2.5 py-0.5 text-sm font-normal text-blue-700 dark:text-blue-700-dark"
            >
              <FontAwesomeIcon
                icon={effectiveExpanded ? faChevronUp : faChevronDown}
                className="text-blue-600 dark:text-blue-600-dark"
              />
              {effectiveExpanded ? t("collapse") : t("expand")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CommentCard;

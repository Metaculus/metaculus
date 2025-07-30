"use client";

import {
  faCaretUp,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC, PropsWithChildren, useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { BECommentType, KeyFactor } from "@/types/comment";
import { parseUserMentions } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import { formatUsername } from "@/utils/formatters/users";

import DiagramProjectIcon from "./DiagramProjectIcon";
import SquareArrowUpRight from "./SquareArrowUpRight";

type Props = {
  comment: BECommentType;
  className?: string;
};

const BottomBottonContainer: FC<PropsWithChildren<{ className?: string }>> = ({
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
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-xs font-normal leading-4 text-gray-600 dark:text-gray-600-dark">
        KEY FACTORS
      </div>

      {keyFactors.map((factor) => (
        <div
          key={factor.id}
          className="rounded border border-white bg-blue-200 px-3 py-2 dark:border-gray-0-dark dark:bg-blue-200-dark"
        >
          <div className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
            {factor.text}
          </div>
        </div>
      ))}
    </div>
  );
};

const ExpandableCommentContent = ({
  comment,
  isExpanded,
  needsExpand,
}: {
  comment: BECommentType;
  isExpanded: boolean;
  needsExpand: boolean;
}) => {
  const locale = useLocale();

  return (
    <div
      className={cn(
        " relative flex flex-col gap-[10px] overflow-hidden p-4",
        !isExpanded && needsExpand && "max-h-[250px]"
      )}
    >
      <div className="text-xs font-normal leading-4 text-gray-600 dark:text-gray-600-dark">
        COMMENT
      </div>

      {/* Author info */}
      <div className="flex items-center gap-2">
        <Link
          href={`/accounts/profile/${comment.author.id}/`}
          className="text-base font-bold leading-6 text-gray-800 no-underline hover:underline dark:text-gray-800-dark"
        >
          {formatUsername(comment.author)}
        </Link>
        <div className="size-0.5 rounded-full bg-gray-500 dark:bg-gray-500-dark" />
        <span
          className="text-base font-normal leading-6 text-gray-500 dark:text-gray-500-dark"
          suppressHydrationWarning
        >
          on {formatDate(locale, new Date(comment.created_at))}
        </span>
      </div>

      {/* Comment text */}
      <div
        className={cn(
          "mb-4 text-base font-normal leading-6 text-gray-700 dark:text-gray-700-dark"
          // !isExpanded && needsExpand && "max-h-[250px] overflow-hidden"
        )}
      >
        <MarkdownEditor
          markdown={parseUserMentions(comment.text, comment.mentioned_users)}
          mode="read"
          withUgcLinks
          withTwitterPreview
        />

        {comment.key_factors && comment.key_factors.length > 0 && (
          <KeyFactors keyFactors={comment.key_factors} />
        )}
      </div>

      {/* Gradient overlay for collapsed state */}

      {!isExpanded && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-b from-transparent to-white to-65% dark:from-transparent dark:to-gray-0-dark" />
      )}
    </div>
  );
};

const CommentCard: FC<Props> = ({ comment, className }) => {
  const t = useTranslations();
  const needsExpand = comment.text.length > 1000;
  const [isExpanded, setIsExpanded] = useState(!needsExpand);
  const keyFactorsVotesCount =
    comment.key_factors?.reduce((acc, factor) => acc + factor.votes_count, 0) ||
    0;

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
        <div className="flex flex-col gap-1.5 border-b border-gray-300 bg-blue-100 p-4 dark:border-gray-300-dark dark:bg-blue-100-dark">
          <div className="text-xs font-normal leading-4 text-gray-600 dark:text-gray-600-dark">
            QUESTION
          </div>

          <Link
            href={`/questions/${comment.on_post_data.id}`}
            className="text-base font-medium leading-6 text-blue-700 no-underline hover:underline dark:text-blue-700-dark"
          >
            {comment.on_post_data.title}
          </Link>
        </div>
      )}

      {/* Expandable comment content */}
      <ExpandableCommentContent
        comment={comment}
        isExpanded={isExpanded}
        needsExpand={needsExpand}
      />

      <div className="flex items-center justify-between p-4">
        {/* Comment votes, change my mind and key factors */}
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500-dark">
          <BottomBottonContainer className=" gap-1.5 text-gray-500 dark:text-gray-500-dark">
            <FontAwesomeIcon icon={faChevronUp} className={cn(``)} />
            <span>{comment.vote_score}</span>
            <FontAwesomeIcon icon={faChevronDown} className={cn(``)} />
          </BottomBottonContainer>

          {comment.changed_my_mind.count > 0 && (
            <BottomBottonContainer className="leading-[114%]">
              <FontAwesomeIcon
                icon={faCaretUp}
                className="mr-2 text-gray-500 dark:text-gray-500-dark"
              />
              <span>{comment.changed_my_mind.count} </span>
              <span className="ml-1 hidden text-nowrap md:block">
                {t("mindsChanged")}
              </span>
            </BottomBottonContainer>
          )}
          {comment.key_factors && comment.key_factors.length > 0 && (
            <BottomBottonContainer className="leading-[114%]">
              <DiagramProjectIcon className="mr-2 fill-gray-500 dark:fill-gray-500-dark" />
              <span>{keyFactorsVotesCount}</span>
              <span className="ml-1 hidden text-nowrap md:block">
                {t("keyFactorVotes")}
              </span>
            </BottomBottonContainer>
          )}
        </div>

        {isExpanded || !needsExpand ? (
          <BottomBottonContainer className="p-1 md:px-2.5 md:py-1">
            <Button
              size="sm"
              variant="text"
              onClick={handleGoToComment}
              className="p-0"
            >
              <SquareArrowUpRight className="size-[14px] md:size-[11px]" />
              <span className="hidden md:block">View comment</span>
            </Button>
          </BottomBottonContainer>
        ) : (
          <BottomBottonContainer className="border-blue-500  dark:border-blue-500-dark ">
            <Button
              variant="text"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="p-0"
            >
              <FontAwesomeIcon
                icon={faChevronDown}
                className="text-blue-600 dark:text-blue-600-dark"
              />
              Expand
            </Button>
          </BottomBottonContainer>
        )}
      </div>
    </div>
  );
};

export default CommentCard;

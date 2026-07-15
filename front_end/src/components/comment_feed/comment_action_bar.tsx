"use client";

import { faReply, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  CmmOverlay,
  CmmToggleButton,
  useCmmContext,
} from "@/components/comment_feed/comment_cmm";
import CommentVoter from "@/components/comment_feed/comment_voter";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { VoteDirection } from "@/types/votes";
import { canPredictQuestion } from "@/utils/questions/predictions";

type Props = {
  comment: BECommentType;
  post: PostWithForecasts;
  onReply: () => void;
  isReplying?: boolean;
  onScrollToLink?: () => void;
  onVoteChange?: (voteScore: number, userVote: VoteDirection | null) => void;
  onCmmToggle?: (enabled: boolean) => void;
};

const CommentActionBar: FC<Props> = ({
  comment,
  post,
  onReply,
  isReplying = false,
  onScrollToLink,
  onVoteChange,
  onCmmToggle,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const userCanPredict = canPredictQuestion(post, user);
  const isCommentAuthor = comment.author.id === user?.id;

  const isCmmVisible =
    !!post.question || !!post.group_of_questions || !!post.conditional;
  const isCmmDisabled = !user || !userCanPredict || isCommentAuthor;

  const baseCmmContext = useCmmContext(
    comment.changed_my_mind.count,
    comment.changed_my_mind.for_this_user
  );

  const cmmContext = onCmmToggle
    ? {
        ...baseCmmContext,
        onCMMToggled: (enabled: boolean) => {
          baseCmmContext.onCMMToggled(enabled);
          onCmmToggle(enabled);
        },
      }
    : baseCmmContext;

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 text-sm leading-4 text-gray-900 dark:text-gray-900-dark">
        <CommentVoter
          voteData={{
            commentAuthorId: comment.author.id,
            commentId: comment.id,
            voteScore: comment.vote_score,
            userVote: comment.user_vote ?? null,
          }}
          onVoteChange={onVoteChange}
        />
        {isReplying ? (
          <Button size="xxs" variant="tertiary" onClick={onReply}>
            <FontAwesomeIcon icon={faXmark} className="size-4 p-1" />
            {t("cancel")}
          </Button>
        ) : (
          <Button
            size="xxs"
            variant="tertiary"
            onClick={onReply}
            className="gap-0.5"
          >
            <FontAwesomeIcon icon={faReply} className="size-4 p-1" size="xs" />
            {t("reply")}
          </Button>
        )}
        {isCmmVisible && (
          <CmmToggleButton
            comment_id={comment.id}
            cmmContext={cmmContext}
            disabled={isCmmDisabled}
            ref={cmmContext.setAnchorRef}
          />
        )}
      </div>
      <CmmOverlay
        cmmContext={cmmContext}
        showForecastingUI={false}
        onClickScrollLink={onScrollToLink ?? (() => {})}
      />
    </>
  );
};

export default CommentActionBar;

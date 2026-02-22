"use client";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useState } from "react";

import { votePost } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post } from "@/types/post";
import { VoteDirection } from "@/types/votes";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

type Props = {
  className?: string;
  post: Post;
  questionPage?: boolean;
};

const PostVoter: FC<Props> = ({ className, post, questionPage }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [vote, setVote] = useState(post.vote);
  const handleVote = async (direction: VoteDirection) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot) {
      return;
    }

    try {
      const newDirection = vote.user_vote === direction ? null : direction;
      const response = await votePost(post.id, newDirection);
      if ("score" in response) {
        setVote({ user_vote: newDirection, score: response.score });
      }
      sendAnalyticsEvent("questionVoted", {
        event_label: questionPage ? "questionPage" : "questionFeed",
      });
    } catch (e) {
      logError(e);
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-xs bg-gray-200 p-1 dark:bg-gray-200-dark",
        className
      )}
    >
      <Button
        variant="text"
        size="sm"
        onClick={() => handleVote(1)}
        aria-label="Upvote"
        className="group h-4 w-4 border-none"
        presentationType="icon"
      >
        {vote.user_vote === 1 ? (
          <FontAwesomeIcon
            size="sm"
            icon={faChevronUp}
            className="rounded-xs bg-mint-400 p-0.5 text-mint-800 dark:bg-mint-400-dark dark:text-mint-800-dark"
          />
        ) : (
          <FontAwesomeIcon
            size="sm"
            icon={faChevronUp}
            className="text-gray-400 group-hover:text-blue-700 dark:text-gray-400-dark dark:group-hover:text-blue-700-dark"
          />
        )}
      </Button>
      {!!vote.score != null && vote.score !== 0 && (
        <span className="text-xs font-normal text-gray-700 dark:text-gray-700-dark">
          <span className="font-medium tabular-nums">{vote.score}</span>
        </span>
      )}
      <Button
        variant="text"
        size="sm"
        onClick={() => handleVote(-1)}
        aria-label="Downvote"
        className="group h-4 w-4 border-none"
        presentationType="icon"
      >
        {vote.user_vote === -1 ? (
          <FontAwesomeIcon
            size="sm"
            icon={faChevronDown}
            className="rounded-xs bg-salmon-300 p-0.5 text-salmon-800 dark:bg-salmon-300-dark dark:text-salmon-800-dark"
          />
        ) : (
          <FontAwesomeIcon
            size="sm"
            icon={faChevronDown}
            className="text-gray-400 group-hover:text-blue-700 dark:text-gray-400-dark dark:group-hover:text-blue-700-dark"
          />
        )}
      </Button>
    </div>
  );
};

export default PostVoter;

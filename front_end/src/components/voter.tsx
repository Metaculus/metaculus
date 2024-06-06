"use client";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

import Button from "@/components/ui/button";
import { VoteDirection } from "@/types/votes";

type Props = {
  className?: string;
  disabled?: boolean;
  votes?: number;
  userVote: VoteDirection;
  onVoteUp: () => void;
  onVoteDown?: () => void;
};

const Voter: FC<Props> = ({
  className,
  disabled,
  votes,
  userVote,
  onVoteUp,
  onVoteDown,
}) => {
  return (
    <div
      className={classNames(
        "inline-flex items-center text-sm leading-4",
        className
      )}
    >
      <Button
        variant="text"
        size="md"
        onClick={onVoteUp}
        aria-label="Upvote"
        className="group"
        disabled={disabled}
        presentationType="icon"
      >
        {userVote === 1 ? (
          <FontAwesomeIcon
            icon={faChevronUp}
            className="rounded-full bg-gradient-to-b from-metac-olive-400 to-metac-blue-100 p-1 text-metac-olive-700 group-hover:from-metac-olive-500 group-hover:to-metac-blue-100 dark:from-metac-olive-300-dark dark:to-metac-blue-100-dark dark:text-metac-olive-700-dark dark:group-hover:from-metac-olive-500-dark dark:group-hover:to-metac-blue-100-dark"
          />
        ) : (
          <FontAwesomeIcon
            icon={faChevronUp}
            className="rounded-full bg-gradient-to-b p-1 text-metac-blue-700 group-hover:from-metac-blue-400 group-hover:to-metac-blue-100 dark:text-metac-blue-700-dark dark:group-hover:from-metac-blue-400-dark dark:group-hover:to-metac-blue-100-dark"
          />
        )}
      </Button>
      {!!votes && (
        <span
          className={classNames(
            "text-metac-gray-900 dark:text-metac-gray-900-dark",
            {
              "font-bold": !!userVote,
            }
          )}
        >
          {votes}
        </span>
      )}
      {onVoteDown && (
        <Button
          variant="text"
          size="md"
          onClick={onVoteDown}
          aria-label="Downvote"
          className="group"
          disabled={disabled}
          presentationType="icon"
        >
          {userVote === -1 ? (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="rounded-full bg-gradient-to-b from-metac-salmon-400/50 to-metac-blue-100 p-1 text-metac-salmon-500 group-hover:from-metac-salmon-400/75 group-hover:to-metac-blue-100 dark:from-metac-salmon-400-dark/50 dark:to-metac-blue-100-dark dark:text-metac-salmon-500-dark dark:group-hover:from-metac-salmon-400-dark/75 dark:group-hover:to-metac-blue-100-dark"
            />
          ) : (
            <FontAwesomeIcon
              icon={faChevronDown}
              className="rounded-full bg-gradient-to-b p-1 text-metac-blue-700 group-hover:from-metac-salmon-400/25 group-hover:to-metac-blue-100 group-hover:text-metac-salmon-700 dark:text-metac-blue-700-dark dark:group-hover:from-metac-salmon-400-dark/25 dark:group-hover:to-metac-blue-100-dark dark:group-hover:text-metac-salmon-700-dark"
            />
          )}
        </Button>
      )}
    </div>
  );
};

export default Voter;

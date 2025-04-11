"use client";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import Button from "@/components/ui/button";
import { VoteDirection } from "@/types/votes";
import cn from "@/utils/cn";

type Props = {
  className?: string;
  disabled?: boolean;
  votes?: number | null;
  userVote: VoteDirection;
  onVoteUp: () => void;
  onVoteDown?: () => void;
  commentArea?: boolean;
  keyFactor?: boolean;
};

const Voter: FC<Props> = ({
  className,
  disabled,
  votes,
  userVote,
  onVoteUp,
  onVoteDown,
  commentArea,
  keyFactor = false,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center text-sm leading-4",
        {
          "rounded-sm border border-blue-500 bg-white dark:border-blue-600/50 dark:bg-gray-0-dark":
            commentArea,
        },
        className
      )}
    >
      <Button
        variant="text"
        size="sm"
        onClick={onVoteUp}
        aria-label="Upvote"
        className="group"
        disabled={disabled}
        presentationType="icon"
      >
        {userVote === 1 ? (
          <FontAwesomeIcon
            icon={faChevronUp}
            className={cn(
              `from-olive-400 to-blue-100 p-1 text-olive-700 group-hover:from-olive-500 group-hover:to-blue-100 dark:from-olive-300-dark dark:to-blue-100-dark dark:text-olive-700-dark dark:group-hover:from-olive-500-dark dark:group-hover:to-blue-100-dark ${
                commentArea
                  ? "rounded-none bg-gradient-to-r"
                  : "rounded-full bg-gradient-to-b "
              }`,
              {
                "h-2.5 w-2.5 rounded-bl-[3px] rounded-tl-[3px] p-1.5":
                  keyFactor,
              }
            )}
          />
        ) : (
          <FontAwesomeIcon
            icon={faChevronUp}
            className={cn(
              `p-1 text-blue-700/50 dark:text-blue-700-dark ${
                commentArea
                  ? "rounded-none bg-gradient-to-r group-hover:from-blue-400/80 group-hover:to-blue-100 dark:group-hover:from-blue-400-dark/50 dark:group-hover:to-blue-100-dark/50"
                  : "rounded-full bg-gradient-to-b group-hover:from-blue-400  group-hover:to-blue-100 dark:group-hover:from-blue-400-dark dark:group-hover:to-blue-100-dark "
              }`,
              {
                "h-2.5 w-2.5 rounded-bl-[3px] rounded-tl-[3px] p-1.5":
                  keyFactor,
              }
            )}
          />
        )}
      </Button>
      {!!votes != null && votes !== 0 && (
        <span
          className={cn("text-gray-900 dark:text-gray-900-dark", {
            "font-bold": !!userVote,
          })}
        >
          {votes}
        </span>
      )}
      {onVoteDown && (
        <Button
          variant="text"
          size="sm"
          onClick={onVoteDown}
          aria-label="Downvote"
          className="group"
          disabled={disabled}
          presentationType="icon"
        >
          {userVote === -1 ? (
            <FontAwesomeIcon
              icon={faChevronDown}
              className={cn(
                `rounded-full from-salmon-400/50 p-1 text-salmon-500 group-hover:from-salmon-400/75 group-hover:to-blue-100 dark:from-salmon-400-dark/50 dark:to-blue-100-dark dark:text-salmon-500-dark dark:group-hover:from-salmon-400-dark/75 dark:group-hover:to-blue-100-dark  ${
                  commentArea
                    ? "rounded-none bg-gradient-to-l"
                    : "rounded-full bg-gradient-to-b"
                }`,
                {
                  "h-2.5 w-2.5 rounded-br-[3px] rounded-tr-[3px] p-1.5":
                    keyFactor,
                }
              )}
            />
          ) : (
            <FontAwesomeIcon
              icon={faChevronDown}
              className={cn(
                `rounded-full p-1 text-blue-700/50 group-hover:from-salmon-400/25 group-hover:to-blue-100 group-hover:text-salmon-700 dark:text-blue-700-dark dark:group-hover:from-salmon-400-dark/25 dark:group-hover:to-blue-100-dark dark:group-hover:text-salmon-700-dark  ${
                  commentArea
                    ? "rounded-none bg-gradient-to-l"
                    : "rounded-full bg-gradient-to-b"
                }`,
                {
                  "h-2.5 w-2.5 rounded-br-[3px] rounded-tr-[3px] p-1.5":
                    keyFactor,
                }
              )}
            />
          )}
        </Button>
      )}
    </div>
  );
};

export default Voter;

"use client";

import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { FC } from "react";

import KeyFactorVoter from "@/components/comment_feed/key_factor_voter";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import cn from "@/utils/cn";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  linkAnchor: string;
};

export const UpdownKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, votes_score, user_vote },
  linkToComment = true,
  linkAnchor,
}) => {
  const scrollTo = useScrollTo();

  return (
    <div
      className={cn(
        "relative flex items-center gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&>.target]:hover:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      {/* Link component does not trigger hash event trigger, so we use <a> instead */}
      <KeyFactorVoter
        className="z-10"
        voteData={{
          keyFactorId: id,
          votesScore: votes_score,
          userVote: user_vote ?? null,
        }}
      />
      <div className="decoration-blue-500 underline-offset-4 dark:decoration-blue-500-dark">
        {text}
      </div>

      <a
        href={linkAnchor}
        onClick={(e) => {
          const target = document.getElementById(linkAnchor.replace("#", ""));
          if (target) {
            if (linkToComment) {
              e.preventDefault();
            }
            scrollTo(target.getBoundingClientRect().top);
          }
          sendGAEvent("event", "KeyFactorClick", { event_label: "fromList" });
        }}
        className="target invisible ml-auto text-blue-600 dark:text-blue-600"
      >
        <FontAwesomeIcon
          icon={faArrowUpRightFromSquare}
          className="size-3 p-1"
        />
      </a>
    </div>
  );
};

export default UpdownKeyFactorItem;

"use client";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import {
  ImpactValues,
  KeyFactor,
  KeyFactorVoteScore,
  KeyFactorVoteTypes,
} from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/cn";
import { logError } from "@/utils/errors";

import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  linkAnchor: string;
};

export const LikertKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, user_votes },
  linkToComment = true,
  linkAnchor,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { setKeyFactorVote } = useCommentsFeed();
  const likertVote = useMemo(
    () =>
      user_votes.find((vote) => vote.vote_type === KeyFactorVoteTypes.LIKERT),
    [user_votes]
  );
  const [voteScore, setVoteScore] = useState(
    !isNil(likertVote?.score) ? likertVote.score : null
  );
  const [showVoter, setShowVoter] = useState(false);

  const handleVote = async (score: KeyFactorVoteScore) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      const newScore = score === voteScore ? null : score;
      const response = await voteKeyFactor({
        id,
        vote: newScore,
        user: user.id,
        vote_type: KeyFactorVoteTypes.LIKERT,
      });

      sendAnalyticsEvent("KeyFactorVote", {
        event_category: "none",
        event_label: isNil(newScore) ? "null" : newScore.toString(),
        variant: "likert",
      });

      if (response && "score" in response) {
        setVoteScore(newScore);
        setKeyFactorVote(
          id,
          {
            vote_type: KeyFactorVoteTypes.LIKERT,
            score: newScore,
          },
          response.score as number
        );
      }
    } catch (error) {
      logError(error);
    }
  };

  // update key factor state in other place on the page
  useEffect(() => {
    if (likertVote) {
      setVoteScore(likertVote.score);
    }
  }, [likertVote]);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-4 rounded border border-transparent bg-blue-200 p-4 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&:hover_.target]:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <div className="relative flex w-full flex-col items-center gap-3 xs:flex-row">
        <Button
          variant="secondary"
          onClick={() => setShowVoter((prev) => !prev)}
          className={cn(
            "shrink-0 gap-1 xs:px-2 xs:py-[1px] xs:text-xs xs:font-normal",
            {
              "bg-blue-900 text-gray-200 hover:bg-blue-900 dark:bg-blue-900-dark dark:text-gray-200-dark hover:dark:bg-blue-900-dark":
                showVoter,
            }
          )}
        >
          {!isNil(voteScore) && (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="h-[14px] w-[14px] xs:h-3 xs:w-3"
            />
          )}
          {t(isNil(voteScore) ? "vote" : "voted")}
        </Button>

        <KeyFactorText
          text={text}
          linkAnchor={linkAnchor}
          linkToComment={linkToComment}
          className="-order-1 text-base leading-5 xs:order-2"
        />
      </div>

      {showVoter && (
        <div className="relative flex w-full flex-col items-center gap-3">
          <p className="m-0 max-w-44 text-center text-sm leading-5 text-gray-600 dark:text-gray-600-dark xs:max-w-full">
            {t("howInfluenceForecast")}
          </p>
          <Button
            presentationType="icon"
            variant="text"
            className="absolute -right-1 -top-0.5 text-gray-500 dark:text-gray-500-dark"
            onClick={() => setShowVoter(false)}
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
          <div className="flex w-full flex-row justify-between gap-2">
            {VOTE_BUTTONS.map((button, index) => (
              <Button
                key={index}
                className={cn(
                  "flex w-full flex-col gap-0 rounded-sm border border-transparent px-1 py-2.5 text-base font-medium leading-5 dark:border-transparent xs:w-full xs:flex-row xs:py-5",
                  button.className,
                  {
                    [button.activeClassName]: voteScore === button.score,
                    "text-gray-0 dark:text-gray-0-dark":
                      voteScore === button.score,
                  }
                )}
                onClick={() => handleVote(button.score)}
              >
                {button.children}
              </Button>
            ))}
          </div>
          <div className="relative flex w-full flex-row justify-between text-xs font-normal text-gray-600 dark:text-gray-600-dark">
            <p className="m-0 capitalize">{t("decreases")}</p>
            <p className="absolute left-1/2 m-0 hidden -translate-x-1/2 capitalize xs:block">
              {t("noImpact")}
            </p>
            <p className="m-0 capitalize">{t("increases")}</p>
          </div>
          {!isNil(voteScore) && (
            <div className="text-xs text-mint-700 dark:text-mint-700-dark">
              {t("thankYouForSubmission")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const VOTE_BUTTONS = [
  {
    score: ImpactValues.HIGH_NEGATIVE,
    children: (
      <>
        <span>-</span>
        <span>-</span>
        <span>-</span>
      </>
    ),
    className:
      "bg-salmon-300 dark:bg-salmon-300-dark active:bg-salmon-300 active:dark:bg-salmon-300-dark text-salmon-700 dark:text-salmon-700-dark hover:bg-salmon-400 hover:border-solid hover:border-salmon-500 hover:dark:border-salmon-500-dark hover:dark:bg-salmon-400-dark",
    activeClassName:
      "bg-salmon-800 dark:bg-salmon-800-dark hover:bg-salmon-800 hover:dark:bg-salmon-800-dark",
  },
  {
    score: ImpactValues.MEDIUM_NEGATIVE,
    children: (
      <>
        <span>-</span>
        <span>-</span>
      </>
    ),
    className:
      "bg-salmon-200 dark:bg-salmon-200-dark active:bg-salmon-200 active:dark:bg-salmon-200-dark text-salmon-700 dark:text-salmon-700-dark hover:bg-salmon-300 hover:dark:bg-salmon-300-dark hover:border-solid hover:border-salmon-400 hover:dark:border-salmon-400-dark",
    activeClassName:
      "bg-salmon-800 dark:bg-salmon-800-dark hover:bg-salmon-800 hover:dark:bg-salmon-800-dark",
  },
  {
    score: ImpactValues.LOW_NEGATIVE,
    children: <span>-</span>,
    className:
      "bg-salmon-100 dark:bg-salmon-100-dark active:bg-salmon-100 active:dark:bg-salmon-100-dark text-salmon-700 dark:text-salmon-700-dark hover:bg-salmon-200 hover:dark:bg-salmon-200-dark hover:border-solid hover:border-salmon-300 hover:dark:border-salmon-300-dark",
    activeClassName:
      "bg-salmon-800 dark:bg-salmon-800-dark hover:bg-salmon-800 hover:dark:bg-salmon-800-dark",
  },
  {
    score: ImpactValues.NO_IMPACT,
    children: <FontAwesomeIcon icon={faCircle} className="h-2.5 w-2.5" />,
    className:
      "bg-blue-100 dark:bg-blue-100-dark active:bg-blue-100 active:dark:bg-blue-100-dark text-blue-500 dark:text-blue-500-dark hover:bg-blue-200 hover:dark:bg-blue-200-dark hover:border-solid hover:border-blue-500 hover:dark:border-blue-500-dark",
    activeClassName:
      "bg-blue-700 dark:bg-blue-700-dark hover:bg-blue-700 hover:dark:bg-blue-700-dark",
  },
  {
    score: ImpactValues.LOW,
    children: <span>+</span>,
    className:
      "bg-mint-200 dark:bg-mint-200-dark active:bg-mint-200 active:dark:bg-mint-200-dark text-mint-800 dark:text-mint-800-dark hover:bg-mint-300 hover:dark:bg-mint-300-dark hover:border-solid hover:border-mint-400 hover:dark:border-mint-400-dark",
    activeClassName:
      "bg-mint-800 dark:bg-mint-800-dark hover:bg-mint-800 hover:dark:bg-mint-800-dark",
  },
  {
    score: ImpactValues.MEDIUM,
    children: (
      <>
        <span>+</span>
        <span>+</span>
      </>
    ),
    className:
      "bg-mint-300 dark:bg-mint-300-dark active:bg-mint-300 active:dark:bg-mint-300-dark text-mint-800 dark:text-mint-800-dark hover:bg-mint-400 hover:dark:bg-mint-400-dark hover:border-solid hover:border-mint-500 hover:dark:border-mint-500-dark",
    activeClassName:
      "bg-mint-800 dark:bg-mint-800-dark hover:bg-mint-800 hover:dark:bg-mint-800-dark",
  },
  {
    score: ImpactValues.HIGH,
    children: (
      <>
        <span>+</span>
        <span>+</span>
        <span>+</span>
      </>
    ),
    className:
      "bg-mint-400 dark:bg-mint-400-dark active:bg-mint-400 active:dark:bg-mint-400-dark text-mint-800 dark:text-mint-800-dark hover:bg-mint-500 hover:dark:bg-mint-500-dark hover:border-solid hover:border-mint-600 hover:dark:border-mint-600-dark",
    activeClassName:
      "bg-mint-800 dark:bg-mint-800-dark hover:bg-mint-800 hover:dark:bg-mint-800-dark",
  },
];

export default LikertKeyFactorItem;

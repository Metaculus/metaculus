"use client";

import {
  faArrowUp,
  faArrowDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import {
  KeyFactor,
  KeyFactorVoteScore,
  KeyFactorVoteTypes,
} from "@/types/comment";
import cn from "@/utils/cn";
import { logError } from "@/utils/errors";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
};

const IMPACT_VALUES = {
  LOW: 2,
  MEDIUM: 3,
  HIGH: 5,
  LOW_NEGATIVE: -2,
  MEDIUM_NEGATIVE: -3,
  HIGH_NEGATIVE: -5,
} as const satisfies Record<string, KeyFactorVoteScore>;

export const TwoStepKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, user_votes },
  linkToComment = true,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const twoStepVote = user_votes.find(
    (vote) => vote.vote_type === KeyFactorVoteTypes.TWO_STEP
  );
  const [voteScore, setVoteScore] = useState(
    !isNil(twoStepVote?.score) ? twoStepVote.score : null
  );
  const [showSecondStep, setShowSecondStep] = useState(
    twoStepVote?.show_second_step ?? false
  );
  const [isSecondStepCompleted, setIsSecondStepCompleted] = useState(false);
  const { setKeyFactorVote } = useCommentsFeed();

  const handleVote = async (
    score: KeyFactorVoteScore,
    isFirstStep: boolean = true
  ) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      const newScore = isFirstStep && score === voteScore ? null : score;
      const response = await voteKeyFactor({
        id,
        vote: newScore,
        user: user.id,
        vote_type: KeyFactorVoteTypes.TWO_STEP,
      });
      // sendGAEvent("event", "KeyFactorTwoStepVote"); // TODO: add new GA event tracking if needed

      if (response && "score" in response) {
        if (isFirstStep) {
          setShowSecondStep(!isNil(newScore));
        }
        setIsSecondStepCompleted(isFirstStep ? false : true);
        setVoteScore(newScore);
        setKeyFactorVote(
          id,
          {
            vote_type: KeyFactorVoteTypes.TWO_STEP,
            score: newScore,
            show_second_step: isFirstStep ? true : false,
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
    const twoStepVote = user_votes.find(
      (vote) => vote.vote_type === KeyFactorVoteTypes.TWO_STEP
    );
    setVoteScore(twoStepVote?.score ?? null);
    if (twoStepVote?.show_second_step) {
      setShowSecondStep(twoStepVote.show_second_step);
    }
  }, [user_votes]);
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <div className="text-center text-base font-medium leading-5 xs:text-left">
        {text}
      </div>
      <div className="mx-auto flex flex-row gap-2 xs:mx-0">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => handleVote(IMPACT_VALUES.MEDIUM)}
          className={cn(
            "rounded-sm border-mint-400 bg-mint-300 text-xs leading-4 text-mint-800 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark xs:bg-gray-0 xs:text-sm xs:text-mint-700 xs:dark:bg-gray-0-dark xs:dark:text-mint-700-dark",
            {
              "border-mint-800 !bg-mint-800 !text-gray-0 dark:border-mint-800-dark dark:!bg-mint-800-dark dark:!text-gray-0-dark":
                voteScore && voteScore > 0,
            }
          )}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            className={cn(
              "hidden text-mint-700 dark:text-mint-700-dark xs:block",
              {
                "!text-gray-0 dark:!text-gray-0-dark":
                  voteScore && voteScore > 0,
              }
            )}
          />
          {t("increasesLikelihood")}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => handleVote(IMPACT_VALUES.MEDIUM_NEGATIVE)}
          className={cn(
            "rounded-sm border-salmon-300 bg-salmon-200 text-xs leading-4 text-salmon-700 hover:border-salmon-400 hover:bg-salmon-300 dark:border-salmon-300-dark dark:bg-salmon-200-dark dark:text-salmon-700-dark xs:bg-gray-0 xs:text-sm xs:dark:bg-gray-0-dark",
            {
              "!border-salmon-800 !bg-salmon-800 !text-gray-0":
                voteScore && voteScore < 0,
            }
          )}
        >
          <FontAwesomeIcon
            icon={faArrowDown}
            className={cn(
              "hidden text-salmon-700 dark:text-salmon-700-dark xs:block",
              {
                "!text-gray-0 dark:!text-gray-0": voteScore && voteScore < 0,
              }
            )}
          />
          {t("decreasesLikelihood")}
        </Button>
      </div>
      {!isNil(voteScore) && showSecondStep && (
        <div className="relative flex flex-col gap-3">
          <div className="text-balance px-10 text-center text-sm font-medium leading-5 text-gray-600 dark:text-gray-600-dark xs:px-0 xs:text-left">
            {t("howImpactfulFactor")}
          </div>
          <Button
            presentationType="icon"
            variant="text"
            className="absolute right-[-4px] top-[-2px] text-gray-500 dark:text-gray-500-dark"
            onClick={() => setShowSecondStep(false)}
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </Button>
          <div className="flex flex-row gap-3">
            <Button
              variant="tertiary"
              size="sm"
              className={cn(
                "w-full rounded-sm border-mint-400 bg-mint-300 text-xs font-normal leading-4 text-mint-800 hover:border-mint-500 hover:bg-mint-400 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark",
                {
                  "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                    isSecondStepCompleted &&
                    !isNil(voteScore) &&
                    Math.abs(voteScore) === IMPACT_VALUES.LOW,
                }
              )}
              onClick={() =>
                handleVote(
                  voteScore < 0
                    ? IMPACT_VALUES.LOW_NEGATIVE
                    : IMPACT_VALUES.LOW,
                  false
                )
              }
            >
              {t("lowImpact")}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className={cn(
                "w-full rounded-sm border-mint-400 bg-mint-300 text-xs font-normal leading-4 text-mint-800 hover:border-mint-500 hover:bg-mint-400 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark",
                {
                  "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                    isSecondStepCompleted &&
                    !isNil(voteScore) &&
                    Math.abs(voteScore) === IMPACT_VALUES.MEDIUM,
                }
              )}
              onClick={() =>
                handleVote(
                  voteScore < 0
                    ? IMPACT_VALUES.MEDIUM_NEGATIVE
                    : IMPACT_VALUES.MEDIUM,
                  false
                )
              }
            >
              {t("moderateImpact")}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className={cn(
                "w-full rounded-sm border-mint-400 bg-mint-300 text-xs font-normal leading-4 text-mint-800 hover:border-mint-500 hover:bg-mint-400 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark",
                {
                  "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                    isSecondStepCompleted &&
                    !isNil(voteScore) &&
                    Math.abs(voteScore) === IMPACT_VALUES.HIGH,
                }
              )}
              onClick={() =>
                handleVote(
                  voteScore < 0
                    ? IMPACT_VALUES.HIGH_NEGATIVE
                    : IMPACT_VALUES.HIGH,
                  false
                )
              }
            >
              {t("highImpact")}
            </Button>
          </div>
          {isSecondStepCompleted && (
            <p className="m-0 text-center text-xs font-medium leading-4 text-mint-700 dark:text-mint-700-dark">
              {t("thankYouForSubmission")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoStepKeyFactorItem;

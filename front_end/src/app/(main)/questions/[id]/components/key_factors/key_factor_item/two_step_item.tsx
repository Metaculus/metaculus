"use client";

import {
  faArrowUp,
  faArrowDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  linkAnchor: string;
  linkToComment?: boolean;
};

export const TwoStepKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, user_votes },
  linkToComment = true,
  linkAnchor,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { setKeyFactorVote } = useCommentsFeed();
  const twoStepVote = useMemo(
    () =>
      user_votes.find((vote) => vote.vote_type === KeyFactorVoteTypes.TWO_STEP),
    [user_votes]
  );
  const [voteScore, setVoteScore] = useState(
    !isNil(twoStepVote?.score) ? twoStepVote.score : null
  );
  const [showSecondStep, setShowSecondStep] = useState(
    twoStepVote?.show_second_step ?? false
  );
  const [isSecondStepCompleted, setIsSecondStepCompleted] = useState(false);

  const handleVote = async (
    score: KeyFactorVoteScore,
    isFirstStep: boolean = true
  ) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      let secondStepCompletion = !isFirstStep;
      let newScore =
        isFirstStep &&
        !isNil(voteScore) &&
        !isNil(score) &&
        ((voteScore < 0 && score < 0) || (voteScore > 0 && score > 0))
          ? null
          : score;
      if (
        !isFirstStep &&
        !isNil(score) &&
        score === voteScore &&
        isSecondStepCompleted
      ) {
        newScore =
          score < 0 ? ImpactValues.MEDIUM_NEGATIVE : ImpactValues.MEDIUM;
        secondStepCompletion = false;
      }

      const response = await voteKeyFactor({
        id,
        vote: newScore,
        user: user.id,
        vote_type: KeyFactorVoteTypes.TWO_STEP,
      });

      sendAnalyticsEvent("KeyFactorVote", {
        event_category: isFirstStep ? "first_step" : "second_step",
        event_label: isNil(newScore) ? "null" : newScore.toString(),
        variant: "2-step",
      });

      if (response && "score" in response) {
        if (isFirstStep) {
          setShowSecondStep(!isNil(newScore));
        }
        setIsSecondStepCompleted(secondStepCompletion);
        setVoteScore(newScore);
        setKeyFactorVote(
          id,
          {
            vote_type: KeyFactorVoteTypes.TWO_STEP,
            score: newScore,
            show_second_step: !isNil(newScore) ? true : false,
            second_step_completed: secondStepCompletion,
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
    if (twoStepVote) {
      setVoteScore(twoStepVote.score);
      setIsSecondStepCompleted(twoStepVote.second_step_completed ?? false);
      setShowSecondStep(twoStepVote.show_second_step ?? false);
    }
  }, [twoStepVote]);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&:hover_.target]:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <KeyFactorText
        text={text}
        linkAnchor={linkAnchor}
        linkToComment={linkToComment}
      />
      <div className="mx-auto flex flex-row gap-2 xs:mx-0">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => handleVote(ImpactValues.MEDIUM)}
          className={cn(
            "rounded-sm border-mint-400 bg-mint-300 px-2.5 py-1 text-xs capitalize leading-4 text-mint-800 hover:border-mint-700 hover:bg-mint-200 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-700-dark dark:hover:bg-mint-200-dark xs:bg-gray-0 xs:text-sm xs:text-mint-700 xs:hover:text-mint-800 xs:dark:bg-gray-0-dark xs:dark:text-mint-700-dark xs:dark:hover:text-mint-800-dark",
            {
              "border-mint-800 !bg-mint-800 !text-gray-0 dark:border-mint-800-dark dark:!bg-mint-800-dark dark:!text-gray-0-dark":
                voteScore && voteScore > 0,
            }
          )}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            className={cn("hidden xs:block", {
              "!text-gray-0 dark:!text-gray-0-dark": voteScore && voteScore > 0,
            })}
          />
          {t("increasesLikelihood")}
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => handleVote(ImpactValues.MEDIUM_NEGATIVE)}
          className={cn(
            "rounded-sm border-salmon-300 bg-salmon-200 px-2.5 py-1 text-xs capitalize leading-4 text-salmon-700 hover:border-salmon-400 hover:bg-salmon-300 dark:border-salmon-300-dark dark:bg-salmon-200-dark dark:text-salmon-700-dark dark:hover:border-salmon-400-dark dark:hover:bg-salmon-300-dark xs:bg-gray-0 xs:text-sm xs:hover:text-salmon-800 xs:dark:bg-gray-0-dark xs:dark:hover:text-salmon-800-dark",
            {
              "!border-salmon-800 !bg-salmon-800 !text-gray-0":
                voteScore && voteScore < 0,
            }
          )}
        >
          <FontAwesomeIcon
            icon={faArrowDown}
            className={cn("hidden xs:block", {
              "!text-gray-0 dark:!text-gray-0": voteScore && voteScore < 0,
            })}
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
              className={cn("w-full rounded-sm text-xs font-normal leading-4", {
                "border-salmon-500 bg-salmon-300 text-salmon-800 hover:border-salmon-600 hover:bg-salmon-400 active:border-salmon-500 active:bg-salmon-300 dark:border-salmon-500-dark dark:bg-salmon-300-dark dark:text-salmon-800-dark dark:hover:border-salmon-500-dark dark:hover:bg-salmon-400-dark dark:active:border-salmon-500-dark dark:active:bg-salmon-300-dark":
                  voteScore < 0,
                "border-mint-400 bg-mint-300 text-mint-800 hover:border-mint-500 hover:bg-mint-400 active:border-mint-400 active:bg-mint-300 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark dark:active:border-mint-400-dark dark:active:bg-mint-300-dark":
                  voteScore > 0,
                "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.LOW,
                "border-salmon-800 bg-salmon-800 text-gray-0 hover:bg-salmon-800 dark:border-salmon-800 dark:bg-salmon-800 dark:text-gray-0":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.LOW_NEGATIVE,
              })}
              onClick={() =>
                handleVote(
                  voteScore < 0 ? ImpactValues.LOW_NEGATIVE : ImpactValues.LOW,
                  false
                )
              }
            >
              {t("lowImpact")}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className={cn("w-full rounded-sm text-xs font-normal leading-4", {
                "border-salmon-500 bg-salmon-300 text-salmon-800 hover:border-salmon-600 hover:bg-salmon-400 active:border-salmon-500 active:bg-salmon-300 dark:border-salmon-500-dark dark:bg-salmon-300-dark dark:text-salmon-800-dark dark:hover:border-salmon-500-dark dark:hover:bg-salmon-400-dark dark:active:border-salmon-500-dark dark:active:bg-salmon-300-dark":
                  voteScore < 0,
                "border-mint-400 bg-mint-300 text-mint-800 hover:border-mint-500 hover:bg-mint-400 active:border-mint-400 active:bg-mint-300 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark dark:active:border-mint-400-dark dark:active:bg-mint-300-dark":
                  voteScore > 0,
                "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.MEDIUM,
                "border-salmon-800 bg-salmon-800 text-gray-0 hover:bg-salmon-800 dark:border-salmon-800 dark:bg-salmon-800 dark:text-gray-0":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.MEDIUM_NEGATIVE,
              })}
              onClick={() =>
                handleVote(
                  voteScore < 0
                    ? ImpactValues.MEDIUM_NEGATIVE
                    : ImpactValues.MEDIUM,
                  false
                )
              }
            >
              {t("moderateImpact")}
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              className={cn("w-full rounded-sm text-xs font-normal leading-4", {
                "border-salmon-500 bg-salmon-300 text-salmon-800 hover:border-salmon-600 hover:bg-salmon-400 active:border-salmon-500 active:bg-salmon-300 dark:border-salmon-500-dark dark:bg-salmon-300-dark dark:text-salmon-800-dark dark:hover:border-salmon-500-dark dark:hover:bg-salmon-400-dark dark:active:border-salmon-500-dark dark:active:bg-salmon-300-dark":
                  voteScore < 0,
                "border-mint-400 bg-mint-300 text-mint-800 hover:border-mint-500 hover:bg-mint-400 active:border-mint-400 active:bg-mint-300 dark:border-mint-400-dark dark:bg-mint-300-dark dark:text-mint-800-dark dark:hover:border-mint-500-dark dark:hover:bg-mint-400-dark dark:active:border-mint-400-dark dark:active:bg-mint-300-dark":
                  voteScore > 0,
                "border-mint-800 bg-mint-800 text-gray-0 hover:bg-mint-800 dark:border-mint-800-dark dark:bg-mint-800-dark dark:text-gray-0-dark dark:hover:bg-mint-800-dark":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.HIGH,
                "border-salmon-800 bg-salmon-800 text-gray-0 hover:bg-salmon-800 dark:border-salmon-800 dark:bg-salmon-800 dark:text-gray-0":
                  isSecondStepCompleted &&
                  !isNil(voteScore) &&
                  voteScore === ImpactValues.HIGH_NEGATIVE,
              })}
              onClick={() =>
                handleVote(
                  voteScore < 0
                    ? ImpactValues.HIGH_NEGATIVE
                    : ImpactValues.HIGH,
                  false
                )
              }
            >
              {t("highImpact")}
            </Button>
          </div>
          {isSecondStepCompleted && (
            <p
              className={cn("m-0 text-center text-xs font-medium leading-4", {
                "text-salmon-700 dark:text-salmon-700-dark": voteScore < 0,
                "text-mint-700 dark:text-mint-700-dark": voteScore > 0,
              })}
            >
              {t("thankYouForSubmission")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TwoStepKeyFactorItem;

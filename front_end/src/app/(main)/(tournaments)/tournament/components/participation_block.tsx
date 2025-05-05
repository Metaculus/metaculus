"use client";

import { faCheckCircle, faClock } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowsUpDown,
  faArrowUp,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { FlowType } from "@/app/(prediction-flow)/components/prediction_flow_provider";
import {
  isPostWithSignificantMovement,
  isPostStale,
} from "@/app/(prediction-flow)/helpers";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { PredictionFlowPost } from "@/types/post";
import { Tournament } from "@/types/projects";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

type Props = {
  tournament: Tournament;
  posts: PredictionFlowPost[];
};

const ParticipationBlock: FC<Props> = ({ tournament, posts }) => {
  const { user } = useAuth();
  const t = useTranslations();

  if (isNil(user) || !tournament.forecasts_flow_enabled) {
    return null;
  }
  const isParticipated = posts.some((post) =>
    isPostOpenQuestionPredicted(post)
  );
  let unpredictedQuestions: PredictionFlowPost[] = [];
  let stalePredictions: PredictionFlowPost[] = [];
  let significantMovementPredictions: PredictionFlowPost[] = [];
  if (isParticipated) {
    unpredictedQuestions = posts.filter(
      (post) => !isPostOpenQuestionPredicted(post)
    );
    stalePredictions = posts.filter((post) => isPostStale(post));
    significantMovementPredictions = posts.filter((post) =>
      isPostWithSignificantMovement(post)
    );
  }
  const isRequireAttention =
    !!unpredictedQuestions.length ||
    !!stalePredictions.length ||
    !!significantMovementPredictions.length;

  return (
    <div className="mx-4 mt-4 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-300-dark dark:bg-orange-50-dark sm:px-8 sm:py-7 lg:mx-0">
      <p className="m-0 text-base font-medium text-orange-800 dark:text-orange-800-dark sm:text-xl">
        {t("myParticipation")}
      </p>
      {!isParticipated && (
        <p className="m-0 mt-1 text-sm text-gray-700 dark:text-gray-700-dark sm:mt-2 sm:text-base">
          {t("noParticipationTournament")}
        </p>
      )}
      {/* Require attention block */}
      {isParticipated && isRequireAttention && (
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Unpredicted questions */}
            {!!unpredictedQuestions.length && (
              <Link
                href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.NOT_PREDICTED}`}
                className="group relative m-0 flex w-fit items-center text-xs  text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
              >
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="mr-2.5 h-[18px] w-4 text-orange-700 dark:text-orange-700-dark"
                />
                {t("questionsNotPredicted", {
                  count: unpredictedQuestions.length,
                })}
                <FontAwesomeIcon
                  icon={faArrowUp}
                  className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
                />
              </Link>
            )}
            {/* Significant movement forecasts */}
            {!!significantMovementPredictions.length && (
              <Link
                href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.MOVEMENT}`}
                className="group relative m-0 flex w-fit items-center text-xs text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
              >
                <FontAwesomeIcon
                  icon={faArrowsUpDown}
                  className="mr-2.5 h-4 w-4 text-orange-700 dark:text-orange-700-dark"
                />
                {t("significantMovementForecasts", {
                  count: significantMovementPredictions.length,
                })}
                <FontAwesomeIcon
                  icon={faArrowUp}
                  className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
                />
              </Link>
            )}
            {/* Stale predictions */}
            {!!stalePredictions.length && (
              <Link
                href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.STALE}`}
                className="group relative m-0 flex w-fit items-center text-xs text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
              >
                <FontAwesomeIcon
                  icon={faClock}
                  className="mr-2.5 h-4 w-4 text-orange-700 dark:text-orange-700-dark"
                />
                {t("stalePredictions", { count: stalePredictions.length })}
                <FontAwesomeIcon
                  icon={faArrowUp}
                  className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
                />
              </Link>
            )}
          </div>

          <Button
            variant="tertiary"
            size="lg"
            className="mt-4 w-full sm:mt-4"
            href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.GENERAL}`}
          >
            {t("reviewAll")}
          </Button>
        </div>
      )}
      {isParticipated && !isRequireAttention && (
        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-2.5">
          <p className="m-0 text-xs text-olive-700 dark:text-olive-700-dark sm:text-sm">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2.5 h-4 w-4" />
            {t("allQuestionsForecasted")}
          </p>
          <p className="m-0 text-xs text-olive-700 dark:text-olive-700-dark sm:text-sm">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2.5 h-4 w-4" />
            {t("noForecastsWithSignificantMovement")}
          </p>
          <p className="m-0 text-xs text-olive-700 dark:text-olive-700-dark sm:text-sm">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2.5 h-4 w-4" />
            {t("predictionsUpToDate")}
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipationBlock;

"use client";

import {
  faCheckCircle,
  faClock,
  IconDefinition,
} from "@fortawesome/free-regular-svg-icons";
import {
  faArrowsUpDown,
  faArrowUp,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback } from "react";

import { FlowType } from "@/app/(prediction-flow)/components/prediction_flow_provider";
import {
  isPostStale,
  isPostWithSignificantMovement,
} from "@/app/(prediction-flow)/helpers";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { PredictionFlowPost } from "@/types/post";
import { Tournament, TournamentType } from "@/types/projects";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";
import { getProjectSlug } from "@/utils/navigation";

type Props = {
  tournament: Tournament;
  posts: PredictionFlowPost[];
};

const ParticipationBlock: FC<Props> = ({ tournament, posts }) => {
  const { user } = useAuth();
  const t = useTranslations();
  const tournamentSlug = getProjectSlug(tournament);

  const getProjectTypeNoun = useCallback(() => {
    switch (tournament.type) {
      case TournamentType.QuestionSeries:
        return t("QuestionSeries").toLowerCase();
      case TournamentType.Index:
        return t("Index").toLowerCase();
      default:
        return t("Tournament").toLowerCase();
    }
  }, [tournament.type, t]);

  if (
    isNil(user) ||
    !tournament.forecasts_flow_enabled ||
    tournament.timeline.all_questions_closed
  ) {
    return null;
  }
  const isParticipated = posts.some((post) =>
    isPostOpenQuestionPredicted(post, {
      checkAllSubquestions: false,
      treatClosedAsPredicted: false,
      treatWithdrawnAsPredicted: true,
    })
  );
  const unpredictedPosts: PredictionFlowPost[] = [];
  const withdrawnPosts: PredictionFlowPost[] = [];
  const stalePredictionsPosts: PredictionFlowPost[] = [];
  const significantMovementPosts: PredictionFlowPost[] = [];

  posts.forEach((post) => {
    // Check if post has withdrawn forecasts (was predicted but now inactive)
    const hasWithdrawnForecast = isPostOpenQuestionPredicted(post, {
      treatWithdrawnAsPredicted: true,
    });
    const hasActiveForecast = isPostOpenQuestionPredicted(post);

    if (hasWithdrawnForecast && !hasActiveForecast) {
      withdrawnPosts.push(post);
    } else if (!hasActiveForecast) {
      unpredictedPosts.push(post);
    }
    if (isPostStale(post)) {
      stalePredictionsPosts.push(post);
    }
    if (isPostWithSignificantMovement(post)) {
      significantMovementPosts.push(post);
    }
  });
  const isRequireAttention =
    !!unpredictedPosts.length ||
    !!withdrawnPosts.length ||
    !!stalePredictionsPosts.length ||
    !!significantMovementPosts.length;

  return (
    <div className="mx-4 mt-4 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-300-dark dark:bg-orange-50-dark sm:px-8 sm:py-7 lg:mx-0">
      <p className="m-0 text-base font-medium text-orange-800 dark:text-orange-800-dark sm:text-xl">
        {t("myParticipation")}
      </p>
      {!isParticipated && (
        <p className="m-0 mt-1 text-sm text-gray-700 dark:text-gray-700-dark sm:mt-2 sm:text-base">
          {t.rich("noParticipationProject", {
            projectType: getProjectTypeNoun(),
          })}
        </p>
      )}
      {/* Require attention block */}
      {isParticipated && isRequireAttention && (
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Unpredicted questions */}
            {!!unpredictedPosts.length && (
              <ParticipationBlockLink
                href={`/tournament/${tournamentSlug}/prediction-flow?flow_type=${FlowType.NOT_PREDICTED}`}
                text={t("questionsNotPredicted", {
                  count: unpredictedPosts.length,
                })}
                icon={faExclamationTriangle}
              />
            )}
            {/* Withdrawn questions */}
            {!!withdrawnPosts.length && (
              <ParticipationBlockLink
                href={`/tournament/${tournamentSlug}/prediction-flow?flow_type=${FlowType.NOT_PREDICTED}`}
                text={t("questionsPreviouslyPredicted", {
                  count: withdrawnPosts.length,
                })}
                icon={faClock}
              />
            )}
            {/* Significant movement forecasts */}
            {!!significantMovementPosts.length && (
              <ParticipationBlockLink
                href={`/tournament/${tournamentSlug}/prediction-flow?flow_type=${FlowType.MOVEMENT}`}
                text={t("significantMovementForecasts", {
                  count: significantMovementPosts.length,
                })}
                icon={faArrowsUpDown}
              />
            )}
            {/* Stale predictions */}
            {!!stalePredictionsPosts.length && (
              <ParticipationBlockLink
                href={`/tournament/${tournamentSlug}/prediction-flow?flow_type=${FlowType.STALE}`}
                text={t("stalePredictions", {
                  count: stalePredictionsPosts.length,
                })}
                icon={faClock}
              />
            )}
          </div>

          <Button
            variant="tertiary"
            size="lg"
            className="mt-4 w-full sm:mt-4"
            href={`/tournament/${tournamentSlug}/prediction-flow?flow_type=${FlowType.GENERAL}`}
          >
            {t("reviewAll")}
          </Button>
        </div>
      )}
      {isParticipated && !isRequireAttention && (
        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-2.5">
          <StatusMessage text={t("allQuestionsPredicted")} />
          <StatusMessage text={t("noForecastsWithSignificantMovement")} />
          <StatusMessage text={t("predictionsUpToDate")} />
        </div>
      )}
    </div>
  );
};

type ParticipationBlockLinkProps = {
  href: string;
  text: string;
  icon: IconDefinition;
};

const ParticipationBlockLink: FC<ParticipationBlockLinkProps> = ({
  href,
  text,
  icon,
}) => {
  return (
    <Link
      href={href}
      className="group relative m-0 flex w-fit items-center text-xs text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
    >
      <FontAwesomeIcon
        icon={icon}
        className="mr-2.5 h-4 w-4 text-orange-700 dark:text-orange-700-dark"
      />
      {text}
      <FontAwesomeIcon
        icon={faArrowUp}
        className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
      />
    </Link>
  );
};

type StatusMessageProps = {
  text: string;
};

const StatusMessage: FC<StatusMessageProps> = ({ text }) => {
  return (
    <p className="m-0 text-xs text-olive-700 dark:text-olive-700-dark sm:text-sm">
      <FontAwesomeIcon icon={faCheckCircle} className="mr-2.5 h-4 w-4" />
      {text}
    </p>
  );
};

export default ParticipationBlock;

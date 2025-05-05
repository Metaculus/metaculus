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
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { Tournament } from "@/types/projects";
import { isPostPredicted } from "@/utils/forecasts/helpers";

type Props = {
  tournament: Tournament;
  posts: PostWithForecasts[];
};

const ParticipationBlock: FC<Props> = ({ tournament, posts }) => {
  const { user } = useAuth();
  const t = useTranslations();
  const isParticipated = posts.some((post) => isPostPredicted(post));
  const isRequireAttention = true; // TODO: adjust with BE endpoint data

  if (isNil(user)) {
    return null;
  }

  return (
    <div className="dark:bg-orange-50-dark dark:bg-orange-50-dark mx-4 mt-4 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 dark:border-orange-300-dark sm:px-8 sm:py-7 lg:mx-0">
      <p className="m-0 text-base font-medium text-orange-800 dark:text-orange-800-dark sm:text-xl">
        {t("myParticipation")}
      </p>
      {!isParticipated && (
        <p className="m-0 mt-1 text-sm text-gray-700 dark:text-gray-700-dark sm:mt-2 sm:text-base">
          {t("noParticipationTournament")}
        </p>
      )}
      {/* Require attention block */}
      {isRequireAttention && (
        <div className="mt-3 sm:mt-4">
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Unpredicted questions */}
            <Link
              href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.NOT_PREDICTED}`}
              className="group relative m-0 flex w-fit items-center text-xs  text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
            >
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="mr-2.5 h-[18px] w-4 text-orange-700 dark:text-orange-700-dark"
              />
              {t("questionsNotPredicted", { count: 15 })}
              <FontAwesomeIcon
                icon={faArrowUp}
                className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
              />
            </Link>
            {/* Significant movement forecasts */}
            <Link
              href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.MOVEMENT}`}
              className="group relative m-0 flex w-fit items-center text-xs text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
            >
              <FontAwesomeIcon
                icon={faArrowsUpDown}
                className="mr-2.5 h-4 w-4 text-orange-700 dark:text-orange-700-dark"
              />
              {t("significantMovementForecasts", { count: 2 })}
              <FontAwesomeIcon
                icon={faArrowUp}
                className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
              />
            </Link>
            {/* Stale predictions */}
            <Link
              href={`/tournament/${tournament.slug}/prediction-flow?flow_type=${FlowType.STALE}`}
              className="group relative m-0 flex w-fit items-center text-xs text-blue-800 no-underline hover:underline hover:decoration-orange-500 dark:text-blue-800-dark sm:text-sm"
            >
              <FontAwesomeIcon
                icon={faClock}
                className="mr-2.5 h-4 w-4 text-orange-700 dark:text-orange-700-dark"
              />
              {t("stalePredictions", { count: 5 })}
              <FontAwesomeIcon
                icon={faArrowUp}
                className="absolute left-full top-0 ml-1 hidden rotate-45 text-blue-800/50 group-hover:block dark:text-blue-800-dark/50"
              />
            </Link>
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
      {/* TODO: adjust condition to show this block */}
      {/*isParticipated && !isRequireAttention  */}
      {true && (
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

import {
  faUsersLine,
  faArrowsUpToLine,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import SectionToggle, { SectionVariant } from "@/components/ui/section_toggle";
import { QuestionWithForecasts, ScoreData } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
  variant?: SectionVariant;
};

const ScoreDisplay: FC<Props> = ({ question, className, variant }) => {
  const t = useTranslations();
  const cp_scores = question.aggregations.recency_weighted.score_data;
  const user_scores = question.my_forecasts?.score_data;
  if (!cp_scores && !user_scores) return null;

  return (
    <>
      <div
        className={cn(
          "mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4",
          className
        )}
      >
        {user_scores?.baseline_score != null && (
          <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
            <FontAwesomeIcon
              icon={faArrowsUpToLine}
              className="text-base leading-none text-blue-800 dark:text-blue-800-dark"
            />
            <span className="text-sm font-normal">{t("myBaselineScore")}</span>
            <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
              {user_scores.baseline_score.toFixed(1)}
            </div>
          </div>
        )}
        {user_scores?.peer_score != null && (
          <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
            <FontAwesomeIcon
              icon={faUsersLine}
              className="text-base leading-none text-blue-800 dark:text-blue-800-dark"
            />
            <span className="text-sm font-normal">{t("myPeerScore")}</span>
            <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
              {user_scores.peer_score.toFixed(1)}
            </div>
          </div>
        )}
        {cp_scores?.baseline_score != null && (
          <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
            <FontAwesomeIcon
              icon={faArrowsUpToLine}
              className="text-base leading-none text-olive-700 dark:text-olive-700-dark"
            />
            <span className="text-sm font-normal">
              {t("communityBaselineScore")}
            </span>
            <div className="text-sm font-bold leading-6">
              {cp_scores.baseline_score.toFixed(1)}
            </div>
          </div>
        )}
        {cp_scores?.peer_score != null && (
          <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
            <FontAwesomeIcon
              icon={faUsersLine}
              className="text-base leading-none text-olive-700 dark:text-olive-700-dark"
            />
            <span className="text-sm font-normal">
              {t("communityPeerScore")}
            </span>
            <div className="text-sm font-bold leading-6">
              {cp_scores.peer_score.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      {checkAdditionalScores(user_scores, cp_scores) && (
        <SectionToggle
          title="Additional Scores"
          defaultOpen={false}
          variant={variant}
        >
          <div className="my-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {user_scores?.spot_baseline_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  {t("mySpotBaselineScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.spot_baseline_score.toFixed(1)}
                </div>
              </div>
            )}
            {user_scores?.spot_peer_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  {t("mySpotPeerScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.spot_peer_score.toFixed(1)}
                </div>
              </div>
            )}
            {user_scores?.relative_legacy_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  {t("myRelativeLegacyScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.relative_legacy_score.toFixed(2)}
                </div>
              </div>
            )}
            {user_scores?.relative_legacy_arvhived_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  {t("myRelativeLegacyArchivedScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.relative_legacy_arvhived_score.toFixed(2)}
                </div>
              </div>
            )}
            {cp_scores?.spot_baseline_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  {t("communnitySpotBaselineScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.spot_baseline_score.toFixed(1)}
                </div>
              </div>
            )}
            {cp_scores?.spot_peer_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  {t("communnitySpotPeerScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.spot_peer_score.toFixed(1)}
                </div>
              </div>
            )}
            {cp_scores?.relative_legacy_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  {t("communnityRelativeLegacyScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.relative_legacy_score.toFixed(2)}
                </div>
              </div>
            )}
            {cp_scores?.relative_legacy_arvhived_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  {t("communnityRelativeLegacyArchivedScore")}
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.relative_legacy_arvhived_score.toFixed(2)}
                </div>
              </div>
            )}
            {user_scores?.coverage != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">{t("myCoverage")}</span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {(user_scores.coverage * 100).toFixed(1)}%
                </div>
              </div>
            )}
            {user_scores?.weighted_coverage != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  {t("myWeightedCoverage")}
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {(user_scores.weighted_coverage * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
          {(!!user_scores || !!cp_scores) && (
            <div className="mb-4 flex flex-col gap-3 text-base font-normal leading-5 opacity-90">
              <div>
                Learn more about scores{" "}
                <Link
                  href="/help/scores-faq/"
                  className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
                >
                  here
                </Link>
                .
              </div>
            </div>
          )}
        </SectionToggle>
      )}
    </>
  );
};

function checkAdditionalScores(
  user_scores: ScoreData | undefined,
  cp_scores: ScoreData | undefined
) {
  if (!user_scores && !cp_scores) return false;
  return [
    user_scores?.spot_baseline_score,
    user_scores?.spot_peer_score,
    user_scores?.relative_legacy_score,
    user_scores?.relative_legacy_arvhived_score,
    user_scores?.coverage,
    user_scores?.weighted_coverage,
    cp_scores?.spot_baseline_score,
    cp_scores?.spot_peer_score,
    cp_scores?.relative_legacy_score,
    cp_scores?.relative_legacy_arvhived_score,
    cp_scores?.coverage,
    cp_scores?.weighted_coverage,
  ].some((score) => !!score);
}

export default ScoreDisplay;

import {
  faUsersLine,
  faArrowsUpToLine,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import SectionToggle from "@/components/ui/section_toggle";
import { QuestionWithForecasts, ScoreData } from "@/types/question";
type Props = {
  question: QuestionWithForecasts;
};

const ScoreDisplay: FC<Props> = ({ question }) => {
  const cp_scores = question.aggregations.recency_weighted.score_data;
  const user_scores = question.my_forecasts?.score_data;
  if (!cp_scores && !user_scores) return null;

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {user_scores?.baseline_score != null && (
          <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
            <FontAwesomeIcon
              icon={faArrowsUpToLine}
              className="text-base leading-none text-blue-800 dark:text-blue-800-dark"
            />
            <span className="text-sm font-normal">My Baseline Score</span>
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
            <span className="text-sm font-normal">My Peer Score</span>
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
              Community Baseline Score
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
            <span className="text-sm font-normal">Community Peer Score</span>
            <div className="text-sm font-bold leading-6">
              {cp_scores.peer_score.toFixed(1)}
            </div>
          </div>
        )}
      </div>
      {checkAdditionalScores(user_scores) && (
        <SectionToggle title="Additional Scores" defaultOpen={false}>
          <div className="my-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {user_scores?.spot_baseline_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  My Spot Baseline Score
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.spot_baseline_score.toFixed(1)}
                </div>
              </div>
            )}
            {user_scores?.spot_peer_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">My Spot Peer Score</span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.spot_peer_score.toFixed(1)}
                </div>
              </div>
            )}
            {user_scores?.relative_legacy_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  My Relative Legacy Score
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.relative_legacy_score.toFixed(2)}
                </div>
              </div>
            )}
            {user_scores?.relative_legacy_arvhived_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  My Relative Legacy Archived Score
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {user_scores.relative_legacy_arvhived_score.toFixed(2)}
                </div>
              </div>
            )}
            {cp_scores?.spot_baseline_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  Community Spot Baseline Score
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.spot_baseline_score.toFixed(1)}
                </div>
              </div>
            )}
            {cp_scores?.spot_peer_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  Community Spot Peer Score
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.spot_peer_score.toFixed(1)}
                </div>
              </div>
            )}
            {cp_scores?.relative_legacy_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  Community Relative Legacy Score
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.relative_legacy_score.toFixed(2)}
                </div>
              </div>
            )}
            {cp_scores?.relative_legacy_arvhived_score != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-olive-800 dark:border-gray-400-dark dark:text-olive-800-dark">
                <span className="text-sm font-normal">
                  Community Relative Legacy Archived Score
                </span>
                <div className="text-sm font-bold leading-6 text-olive-700 dark:text-olive-700-dark">
                  {cp_scores.relative_legacy_arvhived_score.toFixed(2)}
                </div>
              </div>
            )}
            {user_scores?.coverage != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">My Coverage</span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {(user_scores.coverage * 100).toFixed(1)}%
                </div>
              </div>
            )}
            {user_scores?.weighted_coverage != null && (
              <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
                <span className="text-sm font-normal">
                  My Weighted Coverage
                </span>
                <div className="text-sm font-bold leading-6 text-orange-700 dark:text-orange-700-dark">
                  {(user_scores.weighted_coverage * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </SectionToggle>
      )}
    </>
  );
};

function checkAdditionalScores(user_scores: ScoreData | undefined) {
  if (!user_scores) return false;
  return [
    user_scores.spot_baseline_score,
    user_scores.spot_peer_score,
    user_scores.relative_legacy_score,
    user_scores.relative_legacy_arvhived_score,
    user_scores.coverage,
    user_scores.weighted_coverage,
  ].some((score) => score != null);
}

export default ScoreDisplay;

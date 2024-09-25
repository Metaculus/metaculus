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
      <div className="mb-4 grid grid-cols-4 gap-4">
        {user_scores?.baseline_score != null && (
          <div className="box border border-gray-300 p-2 text-center">
            <span>My Baseline Score</span>
            <div>{user_scores.baseline_score.toFixed(1)}</div>
          </div>
        )}
        {user_scores?.peer_score != null && (
          <div className="box border border-gray-300 p-2 text-center">
            <span>My Peer Score</span>
            <div>{user_scores.peer_score.toFixed(1)}</div>
          </div>
        )}
        {cp_scores?.baseline_score != null && (
          <div className="box border border-gray-300 p-2 text-center">
            <span>Community Baseline Score</span>
            <div>{cp_scores.baseline_score.toFixed(1)}</div>
          </div>
        )}
        {cp_scores?.peer_score != null && (
          <div className="box border border-gray-300 p-2 text-center">
            <span>Community Peer Score</span>
            <div>{cp_scores.peer_score.toFixed(1)}</div>
          </div>
        )}
      </div>
      {checkAdditionalScores(user_scores) && (
        <SectionToggle title="Additional Scores" defaultOpen={false}>
          <div className="mb-4 mt-4 grid grid-cols-4 gap-4">
            {user_scores?.spot_baseline_score != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Spot Baseline Score</span>
                <div>{user_scores.spot_baseline_score.toFixed(1)}</div>
              </div>
            )}
            {user_scores?.spot_peer_score != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Spot Peer Score</span>
                <div>{user_scores.spot_peer_score.toFixed(1)}</div>
              </div>
            )}
            {user_scores?.relative_legacy_score != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Relative Legacy Score</span>
                <div>{user_scores.relative_legacy_score.toFixed(2)}</div>
              </div>
            )}
            {user_scores?.relative_legacy_arvhived_score != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Relative Legacy Archived Score</span>
                <div>
                  {user_scores.relative_legacy_arvhived_score.toFixed(2)}
                </div>
              </div>
            )}
            {user_scores?.coverage != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Coverage</span>
                <div>{(user_scores.coverage * 100).toFixed(1)}%</div>
              </div>
            )}
            {user_scores?.weighted_coverage != null && (
              <div className="box border border-gray-300 p-2 text-center">
                <span>My Weighted Coverage</span>
                <div>{(user_scores.weighted_coverage * 100).toFixed(1)}%</div>
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

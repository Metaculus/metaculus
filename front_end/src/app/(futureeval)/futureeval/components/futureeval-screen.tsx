import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalTabs from "./futureeval-tabs";
import { Section } from "./futureeval-tabs-shell";
import { FutureEvalLeaderboardProvider } from "./leaderboard/futureeval-leaderboard-provider";

type Props = { leaderboard: LeaderboardDetails; current: Section["value"] };

const FutureEvalScreen: React.FC<Props> = ({ leaderboard, current }) => {
  return (
    <FutureEvalLeaderboardProvider leaderboard={leaderboard}>
      <div className="flex flex-1 flex-col">
        <FutureEvalTabs current={current} />
      </div>
    </FutureEvalLeaderboardProvider>
  );
};

export default FutureEvalScreen;

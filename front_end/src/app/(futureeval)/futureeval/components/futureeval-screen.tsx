import { AIBLeaderboardProvider } from "@/app/(main)/aib/components/aib/leaderboard/aib-leaderboard-provider";
import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalTabs from "./futureeval-tabs";
import { Section } from "./futureeval-tabs-shell";

type Props = { leaderboard: LeaderboardDetails; current: Section["value"] };

const FutureEvalScreen: React.FC<Props> = ({ leaderboard, current }) => {
  return (
    <AIBLeaderboardProvider leaderboard={leaderboard}>
      <div className="flex flex-1 flex-col">
        <FutureEvalTabs current={current} />
      </div>
    </AIBLeaderboardProvider>
  );
};

export default FutureEvalScreen;

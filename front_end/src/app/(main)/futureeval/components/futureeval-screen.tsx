import { LeaderboardDetails } from "@/types/scoring";

import FutureEvalBulletin from "./futureeval-bulletin";
import FutureEvalContainer from "./futureeval-container";
import FutureEvalHero from "./futureeval-hero";
import FutureEvalTabs from "./futureeval-tabs";
import { Section } from "./futureeval-tabs-shell";
import { AIBLeaderboardProvider } from "../../aib/components/aib/leaderboard/aib-leaderboard-provider";

type Props = { leaderboard: LeaderboardDetails; current: Section["value"] };

const FutureEvalScreen: React.FC<Props> = ({ leaderboard, current }) => {
  return (
    <AIBLeaderboardProvider leaderboard={leaderboard}>
      <div className="flex flex-1 flex-col bg-gray-0 dark:bg-gray-950">
        <FutureEvalBulletin />
        <FutureEvalContainer>
          <FutureEvalHero />
          <FutureEvalTabs current={current} />
        </FutureEvalContainer>
      </div>
    </AIBLeaderboardProvider>
  );
};

export default FutureEvalScreen;

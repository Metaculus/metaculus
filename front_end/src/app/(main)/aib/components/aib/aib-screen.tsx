import { LeaderboardDetails } from "@/types/scoring";

import AIBContainer from "./aib-container";
import AIBHero from "./aib-hero";
import { AIBLeaderboardProvider } from "./leaderboard/aib-leaderboard-provider";
import AIBTabs from "./tabs/aib-tabs";

type Props = { leaderboard: LeaderboardDetails };

const AIBScreen: React.FC<Props> = ({ leaderboard }) => {
  return (
    <AIBLeaderboardProvider leaderboard={leaderboard}>
      <AIBContainer>
        <AIBHero />
        <AIBTabs />
      </AIBContainer>
    </AIBLeaderboardProvider>
  );
};

export default AIBScreen;

import { LeaderboardDetails } from "@/types/scoring";

import AIBBulletin from "./aib-bulletin";
import AIBContainer from "./aib-container";
import AIBHero from "./aib-hero";
import { AIBLeaderboardProvider } from "./leaderboard/aib-leaderboard-provider";
import AIBTabs from "./tabs/aib-tabs";
import { Section } from "./tabs/aib-tabs-shell";

type Props = { leaderboard: LeaderboardDetails; current: Section["value"] };

const AIBScreen: React.FC<Props> = ({ leaderboard, current }) => {
  return (
    <AIBLeaderboardProvider leaderboard={leaderboard}>
      <AIBBulletin />
      <AIBContainer>
        <AIBHero />
        <AIBTabs current={current} />
      </AIBContainer>
    </AIBLeaderboardProvider>
  );
};

export default AIBScreen;

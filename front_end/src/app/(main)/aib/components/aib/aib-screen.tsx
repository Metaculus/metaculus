import AIBContainer from "./aib-container";
import AIBHero from "./aib-hero";
import AIBTabs from "./tabs/aib-tabs";

const AIBScreen: React.FC = () => {
  return (
    <AIBContainer>
      <AIBHero />
      <AIBTabs />
    </AIBContainer>
  );
};

export default AIBScreen;

import AIBInfoIdeaDescription from "./aib-info-idea-description";
import AIBInfoResources from "./aib-info-resources";
import AIBInfoSubmitSteps from "./aib-info-submit-steps";
import AIBInfoTournaments from "./aib-info-tournaments";

const AIBInfoTab: React.FC = () => {
  return (
    <>
      <AIBInfoIdeaDescription />
      <AIBInfoTournaments />
      <AIBInfoResources />
      <AIBInfoSubmitSteps />
    </>
  );
};

export default AIBInfoTab;

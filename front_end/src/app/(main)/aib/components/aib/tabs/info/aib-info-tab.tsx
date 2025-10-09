import AIBInfoIdeaDescription from "./aib-info-idea-description";
import AIBInfoResources from "./aib-info-resources";
import AIBInfoTournaments from "./aib-info-tournaments";

const AIBInfoTab: React.FC = () => {
  return (
    <>
      <AIBInfoIdeaDescription />
      <AIBInfoTournaments />
      <AIBInfoResources />
    </>
  );
};

export default AIBInfoTab;

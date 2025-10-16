import AIBInfoIdeaDescription from "./aib-info-idea-description";
import AIBInfoResources from "./aib-info-resources";
import AIBInfoSubmitSteps from "./aib-info-submit-steps";
import AIBInfoTournaments from "./aib-info-tournaments";

const AIBInfoTab: React.FC = () => {
  return (
    <>
      <div className="hidden space-y-[60px] sm:pt-5 md:block lg:space-y-[120px] 2xl:pt-0">
        <AIBInfoIdeaDescription />
        <AIBInfoTournaments />
      </div>
      <div className="block space-y-[60px] sm:space-y-[80px] sm:pt-5 md:hidden 2xl:space-y-[120px]">
        <AIBInfoTournaments />
        <AIBInfoIdeaDescription />
      </div>
      <AIBInfoResources />
      <AIBInfoSubmitSteps />
    </>
  );
};

export default AIBInfoTab;

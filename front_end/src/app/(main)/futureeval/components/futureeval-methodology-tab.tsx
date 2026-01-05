import AIBInfoIdeaDescription from "../../aib/components/aib/tabs/info/aib-info-idea-description";
import AIBInfoTournaments from "../../aib/components/aib/tabs/info/aib-info-tournaments";

const FutureEvalMethodologyTab: React.FC = () => {
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
    </>
  );
};

export default FutureEvalMethodologyTab;

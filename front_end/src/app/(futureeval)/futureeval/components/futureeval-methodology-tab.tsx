import FutureEvalMethodologyContent from "./futureeval-methodology-content";
import FutureEvalMethodologySections from "./futureeval-methodology-sections";

const FutureEvalMethodologyTab: React.FC = () => {
  return (
    <div className="space-y-[60px] sm:space-y-[80px] sm:pt-5 lg:space-y-[120px] 2xl:pt-0">
      <FutureEvalMethodologyContent />
      <FutureEvalMethodologySections />
    </div>
  );
};

export default FutureEvalMethodologyTab;

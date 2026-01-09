import FutureEvalMethodologyContent from "./futureeval-methodology-content";
import FutureEvalTournaments from "./futureeval-tournaments";

const FutureEvalMethodologyTab: React.FC = () => {
  return (
    <div className="space-y-[60px] sm:space-y-[80px] sm:pt-5 lg:space-y-[120px] 2xl:pt-0">
      <FutureEvalMethodologyContent />
      <FutureEvalTournaments />
    </div>
  );
};

export default FutureEvalMethodologyTab;

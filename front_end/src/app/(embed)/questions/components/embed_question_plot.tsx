import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import { isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  chartHeight?: number;
};

const EmbedQuestionPlot: React.FC<Props> = ({ post, chartHeight }) => {
  return (
    <>
      {isQuestionPost(post) && (
        <DetailedQuestionCard post={post} embedChartHeight={chartHeight} />
      )}
    </>
  );
};

export default EmbedQuestionPlot;

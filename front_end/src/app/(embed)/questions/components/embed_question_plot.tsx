import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  chartHeight?: number;
  onLegendHeightChange?: (height: number) => void;
};

const EmbedQuestionPlot: React.FC<Props> = ({
  post,
  chartHeight,
  onLegendHeightChange,
}) => {
  const isGroup = isGroupOfQuestionsPost(post);
  return (
    <>
      {isQuestionPost(post) && (
        <DetailedQuestionCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
        />
      )}
      {isGroup && (
        <DetailedGroupCard
          post={post}
          embedChartHeight={chartHeight}
          onLegendHeightChange={onLegendHeightChange}
        />
      )}
    </>
  );
};

export default EmbedQuestionPlot;

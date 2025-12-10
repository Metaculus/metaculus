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
};

const EmbedQuestionPlot: React.FC<Props> = ({ post, chartHeight }) => {
  const isGroup = isGroupOfQuestionsPost(post);
  return (
    <>
      {isQuestionPost(post) && (
        <DetailedQuestionCard post={post} embedChartHeight={chartHeight} />
      )}
      {isGroup && (
        <DetailedGroupCard post={post} embedChartHeight={chartHeight} />
      )}
    </>
  );
};

export default EmbedQuestionPlot;

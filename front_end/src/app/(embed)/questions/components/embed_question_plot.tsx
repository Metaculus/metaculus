import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import { isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
};

const EmbedQuestionPlot: React.FC<Props> = ({ post }) => {
  return <>{isQuestionPost(post) && <DetailedQuestionCard post={post} />}</>;
};

export default EmbedQuestionPlot;

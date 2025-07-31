import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import { isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
};

const QuestionTimeline: React.FC<Props> = ({ postData }) => {
  if (isQuestionPost(postData)) {
    return (
      <div className="mt-8">
        <DetailedQuestionCard post={postData} />
      </div>
    );
  }
  return null;
};

export default QuestionTimeline;

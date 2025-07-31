import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

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
  if (isGroupOfQuestionsPost(postData)) {
    return <DetailedGroupCard post={postData} />;
  }
  return null;
};

export default QuestionTimeline;

import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  postData: PostWithForecasts;
};

const QuestionTimeline: React.FC<Props> = ({ postData }) => {
  if (
    isQuestionPost(postData) &&
    postData.question.status !== QuestionStatus.UPCOMING
  ) {
    return (
      <div className="mt-8 hidden sm:block">
        <DetailedQuestionCard post={postData} />
      </div>
    );
  }
  if (isGroupOfQuestionsPost(postData)) {
    return (
      <div className="mt-8 hidden sm:block">
        <DetailedGroupCard post={postData} />
      </div>
    );
  }
  return null;
};

export default QuestionTimeline;

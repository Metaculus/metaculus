import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import GroupOfQuestionsPrediction from "./group_of_questions_prediction";
import SingleQuestionPrediction from "./single_question_prediction";

type Props = {
  postData: PostWithForecasts;
};

const ConsumerQuestionPrediction: React.FC<Props> = ({ postData }) => {
  if (isQuestionPost(postData)) {
    return <SingleQuestionPrediction />;
  }

  if (isGroupOfQuestionsPost(postData)) {
    return <GroupOfQuestionsPrediction />;
  }

  return null;
};

export default ConsumerQuestionPrediction;

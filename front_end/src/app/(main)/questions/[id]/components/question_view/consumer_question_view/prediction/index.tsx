import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";
import { canPredictQuestion } from "@/utils/questions/predictions";

import GroupOfQuestionsPrediction from "./group_of_questions_prediction";
import SingleQuestionPrediction from "./single_question_prediction";

type Props = {
  postData: PostWithForecasts;
};

const ConsumerQuestionPrediction: React.FC<Props> = ({ postData }) => {
  if (isQuestionPost(postData) && !isMultipleChoicePost(postData)) {
    return (
      <SingleQuestionPrediction
        canPredict={canPredictQuestion(postData)}
        question={postData.question}
      />
    );
  }

  if (isMultipleChoicePost(postData) || isGroupOfQuestionsPost(postData)) {
    return <GroupOfQuestionsPrediction postData={postData} />;
  }

  return null;
};

export default ConsumerQuestionPrediction;

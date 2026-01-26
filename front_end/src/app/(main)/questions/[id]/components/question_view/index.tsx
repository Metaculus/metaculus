import { PostWithForecasts } from "@/types/post";

import ConsumerQuestionView from "./consumer_question_view";
import ForecasterQuestionView from "./forecaster_question_view";
import { QuestionVariantComposer } from "../question_variant_composer";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId?: number;
};

const QuestionView: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
}) => {
  return (
    <QuestionVariantComposer
      consumer={<ConsumerQuestionView postData={postData} />}
      forecaster={
        <ForecasterQuestionView
          postData={postData}
          preselectedGroupQuestionId={preselectedGroupQuestionId}
        />
      }
    />
  );
};

export default QuestionView;

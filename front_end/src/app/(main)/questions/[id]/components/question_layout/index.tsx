import { PropsWithChildren } from "react";

import { PostWithForecasts } from "@/types/post";

import { QuestionVariantComposer } from "../question_variant_composer";
import ConsumerQuestionLayout from "./consumer_question_layout";
import ForecasterQuestionLayout from "./forecaster_question_layout";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};

const QuestionLayout: React.FC<PropsWithChildren<Props>> = ({
  postData,
  preselectedGroupQuestionId,
  children,
}) => {
  return (
    <QuestionVariantComposer
      postData={postData}
      consumer={
        <ConsumerQuestionLayout
          postData={postData}
          preselectedGroupQuestionId={preselectedGroupQuestionId}
        >
          {children}
        </ConsumerQuestionLayout>
      }
      forecaster={
        <ForecasterQuestionLayout
          postData={postData}
          preselectedGroupQuestionId={preselectedGroupQuestionId}
        >
          {children}
        </ForecasterQuestionLayout>
      }
    />
  );
};

export default QuestionLayout;

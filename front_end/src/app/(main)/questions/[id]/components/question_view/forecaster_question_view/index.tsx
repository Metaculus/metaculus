import { Fragment } from "react";

import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import QuestionHeader from "./question_header";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};

const ForecasterQuestionView: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
}) => {
  return (
    <Fragment>
      <QuestionHeader post={postData} />
      {isQuestionPost(postData) && <DetailedQuestionCard post={postData} />}
      {isGroupOfQuestionsPost(postData) && (
        <DetailedGroupCard
          post={postData}
          preselectedQuestionId={preselectedGroupQuestionId}
        />
      )}
      <ForecastMaker post={postData} />
    </Fragment>
  );
};

export default ForecasterQuestionView;

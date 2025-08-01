import ConditionalTimeline from "@/components/conditional_timeline";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import BackgroundInfo from "@/components/question/background_info";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import HistogramDrawer from "../histogram_drawer";
import KeyFactorsSection from "../key_factors/key_factors_section";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};

const QuestionInfo: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
}) => {
  return (
    <div className="flex flex-col gap-2.5">
      <ResolutionCriteria post={postData} />
      {isConditionalPost(postData) && <ConditionalTimeline post={postData} />}

      <KeyFactorsSection postId={postData.id} postStatus={postData.status} />

      <BackgroundInfo post={postData} />
      {isGroupOfQuestionsPost(postData) &&
        postData.group_of_questions.graph_type ===
          GroupOfQuestionsGraphType.FanGraph && (
          <DetailedGroupCard
            post={postData}
            preselectedQuestionId={preselectedGroupQuestionId}
            groupPresentationOverride={
              GroupOfQuestionsGraphType.MultipleChoiceGraph
            }
            className="mt-2"
          />
        )}
      <HistogramDrawer post={postData} />
    </div>
  );
};

export default QuestionInfo;

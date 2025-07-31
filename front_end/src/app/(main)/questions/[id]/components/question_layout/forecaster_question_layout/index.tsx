import { PropsWithChildren } from "react";

import CommentFeed from "@/components/comment_feed";
import ConditionalTimeline from "@/components/conditional_timeline";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import BackgroundInfo from "@/components/question/background_info";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import {
  getPostTitle,
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import HistogramDrawer from "../../histogram_drawer";
import KeyFactorsSection from "../../key_factors/key_factors_section";
import Sidebar from "../../sidebar";
import QuestionSection from "../question_section";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};

const ForecasterQuestionLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  postData,
  preselectedGroupQuestionId,
}) => {
  return (
    <div className="relative z-10 flex w-full flex-col gap-4">
      <QuestionSection>
        {children}
        <div>
          <div className="flex flex-col gap-2.5">
            <ResolutionCriteria post={postData} />
            {isConditionalPost(postData) && (
              <ConditionalTimeline post={postData} />
            )}

            <KeyFactorsSection
              postId={postData.id}
              postStatus={postData.status}
            />

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
        </div>
      </QuestionSection>
      <Sidebar
        postData={postData}
        layout="mobile"
        questionTitle={getPostTitle(postData)}
      />
      <CommentFeed postData={postData} />
    </div>
  );
};

export default ForecasterQuestionLayout;

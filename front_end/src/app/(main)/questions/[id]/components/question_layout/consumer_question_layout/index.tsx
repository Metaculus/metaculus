import { useTranslations } from "next-intl";
import { PropsWithChildren } from "react";

import CommentFeed from "@/components/comment_feed";
import ConditionalTimeline from "@/components/conditional_timeline";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import BackgroundInfo from "@/components/question/background_info";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import {
  Tabs,
  TabsList,
  TabsSection,
  TabsTab,
} from "@/components/ui/tabs/index";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import HistogramDrawer from "../../histogram_drawer";
import KeyFactorsSection from "../../key_factors/key_factors_section";
import QuestionSection from "../question_section";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};
const ConsumerQuestionLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  preselectedGroupQuestionId,
  postData,
}) => {
  const t = useTranslations();

  return (
    <div className="relative z-10 flex w-full flex-col gap-4">
      <QuestionSection compact>
        {children}
        <div className="sm:hidden">
          <Tabs defaultValue="comments" className="-mb-5">
            <TabsList>
              <TabsTab value="comments">{t("comments")}</TabsTab>
              <TabsTab value="timeline">{t("timeline")}</TabsTab>
              <TabsTab value="news">{t("inNews")}</TabsTab>
              <TabsTab value="info">{t("info")}</TabsTab>
            </TabsList>

            <TabsSection value="comments">
              <CommentFeed compactVersion postData={postData} />
            </TabsSection>
            <TabsSection value="timeline">log</TabsSection>
            <TabsSection value="news">News content...</TabsSection>
            <TabsSection value="info">fdsa</TabsSection>
          </Tabs>
        </div>
        <div className="hidden sm:block">
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
      <div className="hidden lg:block">
        <CommentFeed postData={postData} />
      </div>
    </div>
  );
};

export default ConsumerQuestionLayout;
